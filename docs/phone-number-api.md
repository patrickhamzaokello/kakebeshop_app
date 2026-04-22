# Phone Number Handling — Backend API Spec

**Audience:** Backend engineer
**App version this targets:** current `main` branch
**Date:** 2026-04-22

---

## 1. Context

The mobile app enforces a mandatory "add phone number" gate immediately after login. Merchants need a phone number on every buyer account so they can contact them about orders. The current backend has phone-related endpoints but they have two blocking issues:

1. **Twilio Verify Service SID is not configured** — the `TWILIO_VERIFY_SERVICE_SID` environment variable is empty, causing every call to `/auth/phone/add/` to fail with:
   ```
   Failed to send verification code: HTTP 404 error: Unable to create record:
   The requested resource /v2/Services//Verifications was not found
   ```
2. **Profile endpoint returns `phone`, but app was reading `phone_number`** — the field name mismatch meant the app could never detect an existing phone number (this has been fixed on the app side to read both `phone` and `phone_number`).

The app has been updated to a **collect-now, verify-later** flow: the phone number is collected at the gate but OTP verification is optional and can be completed from profile settings. This doc describes what the backend needs to support that flow fully.

---

## 2. Profile Endpoint — Field Name Consistency

### `GET /auth/profile/`

**Current response (confirmed):**
```json
{
  "user": {
    "id": "...",
    "phone": null,
    "phone_verified": false,
    ...
  }
}
```

**Required:** Keep `phone` as the field name. The app now reads `data.phone` (with a fallback to `data.phone_number` for safety). Do not rename it.

Also confirm/add `phone_verified: boolean` in the response — the app will use this in a future "verify your phone" prompt in account settings.

---

## 3. Phone Endpoints

All endpoints below require authentication (`Authorization: Bearer <access_token>`).

### 3.1 `POST /auth/phone/add/`

Stores the phone number against the user and sends an OTP via Twilio Verify.

**Request body:**
```json
{ "phone": "+256787250196" }
```
> Field name is `phone`, not `phone_number`.

**Success response — `200 OK`:**
```json
{
  "success": true,
  "message": "Verification code sent to +256787250196"
}
```

**Validation error response — `400 Bad Request`:**
```json
{
  "error": "Validation failed",
  "details": {
    "phone": ["Enter a valid phone number."]
  }
}
```
> The app keys on the presence of `details` to identify validation errors (bad format, already in use, etc.) and shows them to the user. Any other error shape is treated as an OTP-delivery failure and the app proceeds anyway.

**OTP delivery failure — `500` or `502`:**
```json
{
  "error": "Failed to send verification code",
  "message": "..."
}
```
> The app proceeds past the gate even on this error. The phone number **must still be saved** to the user record before attempting to send the OTP. If Twilio fails, the number should remain stored with `phone_verified: false`.

**Current bug:** The number is NOT saved when Twilio fails. The save and the OTP send must be separated — save first, then attempt OTP. If OTP send fails, return the error but do not roll back the saved number.

---

### 3.2 `POST /auth/phone/verify/`

Verifies the OTP the user received.

**Request body:**
```json
{ "code": "123456" }
```

**Success response — `200 OK`:**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```
After success, set `phone_verified: true` on the user record. The profile endpoint should then return the verified number.

**Error response — `400 Bad Request`:**
```json
{
  "error": "Verification failed",
  "details": {
    "code": ["Invalid or expired verification code."]
  }
}
```

---

### 3.3 `POST /auth/phone/resend/`

Resends the OTP to the stored phone number.

**Request body:**
```json
{ "phone": "+256787250196" }
```

**Success response — `200 OK`:**
```json
{
  "success": true,
  "message": "Verification code resent"
}
```

**Error response — `400 Bad Request`:**
```json
{
  "error": "Resend failed",
  "message": "No pending verification for this number."
}
```

---

### 3.4 `GET /auth/phone/status/`

Returns current phone verification status for the authenticated user.

**Response — `200 OK`:**
```json
{
  "phone": "+256787250196",
  "phone_verified": false
}
```
Returns `"phone": null` if no number has been added yet.

---

### 3.5 `PUT /auth/phone/update/`

Replaces the stored phone number and sends a new OTP.

**Request body:**
```json
{ "phone": "+256700000000" }
```

**Success response — `200 OK`:**
```json
{
  "success": true,
  "message": "Phone number updated. Verification code sent."
}
```
Same save-before-send requirement as `/add/`.

---

### 3.6 `DELETE /auth/phone/remove/`

Removes the phone number from the user record.

**Success response — `200 OK`:**
```json
{
  "success": true,
  "message": "Phone number removed."
}
```

---

## 4. Critical Fix Required: Save Before Send

This is the most important backend change.

**Current behaviour:**
```
POST /auth/phone/add/
  → validate phone
  → call Twilio to create verification
  → if Twilio fails → return error, phone NOT saved
```

**Required behaviour:**
```
POST /auth/phone/add/
  → validate phone
  → save phone to user record (phone_verified = false)
  → call Twilio to create verification
  → if Twilio fails → return error, BUT phone remains saved
```

This ensures that even when Twilio is misconfigured or down, users can pass the app's phone gate (the app stores a local flag that the user has been through the screen), and their number is on record for when verification is re-attempted later from profile settings.

---

## 5. Twilio Configuration

The Twilio Verify Service SID environment variable is empty, causing the double-slash in the API path (`/v2/Services//Verifications`).

**Steps to fix:**
1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Verify → Services** and create a service (or use an existing one)
3. Copy the Service SID (starts with `VA...`)
4. Set the environment variable on the backend server:
   ```
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart the backend server
6. Test with: `POST /auth/phone/add/` with a valid Ugandan number (`+256...`)

---

## 6. End-to-End Flow (for reference)

```
User logs in
    │
    ▼
App calls GET /auth/profile/
    │
    ├─ phone is not null ──► user goes directly to main app
    │
    └─ phone is null ──────► "Add Phone Number" screen shown
                                    │
                                    ▼
                          User enters number, taps Continue
                                    │
                                    ▼
                          POST /auth/phone/add/
                                    │
                          ┌─────────┴──────────┐
                     details error         success or OTP error
                     (bad format)          (number saved)
                          │                     │
                      show error            local flag set
                      stay on screen        → main app
                                                │
                                    (later, from profile settings)
                                                │
                                                ▼
                                    POST /auth/phone/verify/
                                    phone_verified = true on profile
```

---

## 7. Summary of Required Changes

| # | Change | Priority |
|---|--------|----------|
| 1 | Set `TWILIO_VERIFY_SERVICE_SID` env variable | **Critical** |
| 2 | Save phone number to user record BEFORE calling Twilio | **Critical** |
| 3 | Keep `phone` (not `phone_number`) as the profile field name | Already correct |
| 4 | Ensure `phone_verified` field is present in `GET /auth/profile/` response | High |
| 5 | Validation errors must use `details` key (not `errors`) | Already correct per test |
| 6 | All endpoints accept `phone` field name (not `phone_number`) | Already correct per test |
