import apiService from "@/utils/apiBase";
import { AuthVerificationResponse, UserType } from "@/utils/types/models";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthState = {
  // State
  user: UserType;
  isLoggedIn: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;

  // Actions
  setUser: (user: UserType) => void;
  setIsLoading: (loading: boolean) => void;
  setIsNewUser: (isNew: boolean) => void;

  // Auth operations
  checkAuthState: () => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  loginWithSocial: (
    idToken: string,
    provider: string
  ) => Promise<{ success: boolean; msg?: string; isNewUser?: boolean }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  logout: () => Promise<{ success: boolean; msg?: string }>;

  // Email verification
  verifyEmail: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; msg?: string }>;

  verifyPasswordResetcode: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; verificationResponse?: AuthVerificationResponse }>;

  resendVerificationCode: (
    email: string
  ) => Promise<{ success: boolean; msg?: string }>;

  // Password reset
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; msg?: string }>;
  resetPasswordComplete: (
    token: string,
    uidb64: string,
    newPassword: string
  ) => Promise<{ success: boolean; msg?: string }>;

  // User data
  updateUserData: () => Promise<{ success: boolean; msg?: string }>;

  // Onboarding & setup
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoggedIn: false,
      isLoading: true,
      hasCompletedOnboarding: false,
      isNewUser: false,

      // Simple state setters
      setUser: (user: UserType) => set({ user }),
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      setIsNewUser: (isNew: boolean) => set({ isNewUser: isNew }),

      // Check authentication state on app start
      checkAuthState: async () => {
        set({ isLoading: true });
        try {
          const accessToken = await getItemAsync("accessToken");
          const userData = await getItemAsync("userData");
          const hasCompletedOnboarding = await getItemAsync(
            "hasCompletedOnboarding"
          );
          const hasCompletedSourceSelection = await getItemAsync(
            "hasCompletedSourceSelection"
          );

          if (accessToken && userData) {
            const parsedUser = JSON.parse(userData);
            set({
              user: parsedUser,
              isLoggedIn: true,
              hasCompletedOnboarding: hasCompletedOnboarding === "true",
           
            });
          } else {
            set({
              user: null,
              isLoggedIn: false,
              hasCompletedOnboarding: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isLoggedIn: false,
            hasCompletedOnboarding: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Login with email and password
      login: async (email: string, password: string) => {
        try {

          const response = await apiService.post("/auth/login/", {
            email,
            password,
          });

          const data = response.data;

          if (response.success) {
            const { tokens, email: userEmail, username, user_id } = data;

            // Store tokens
            if (tokens?.access && tokens?.refresh) {
              await setItemAsync("accessToken", tokens.access);
              await setItemAsync("refreshToken", tokens.refresh);
            }

            // Store individual user fields
            if (userEmail) await setItemAsync("email", userEmail);
            if (username) await setItemAsync("username", username);
            if (user_id) await setItemAsync("user_id", user_id);

            // Create user object
            const userData: UserType = {
              user_id,
              email: userEmail,
              username,
              full_name: null,
              phone_number: null,
              image: null,
            };

            await setItemAsync("userData", JSON.stringify(userData));

            set({
              user: userData,
              isLoggedIn: true,
            });

            return { success: true };
          } else {
            let msg = data?.details || "Login failed";
            if (
              msg.includes("invalid-credential") ||
              msg.includes("Invalid credentials")
            ) {
              msg = "Invalid Credentials";
            }
            if (msg.includes("invalid-email")) {
              msg = "Invalid Email";
            }
            if (msg.includes("Email is not verified")){
              msg = "Email account not verified";
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          let msg = error.data?.detail || "Login failed";
          if (
            msg.includes("invalid-credential") ||
            msg.includes("Invalid credentials")
          ) {
            msg = "Invalid Credentials";
          }
          if (msg.includes("invalid-email")) {
            msg = "Invalid Email";
          }
          if (msg.includes("Email is not verified")){
            msg = msg
          }
          return { success: false, msg };
         
        }
      },

      // Social login (Google/Apple)
      loginWithSocial: async (idToken: string, provider: string) => {
        try {
          if (provider !== "google" && provider !== "apple") {
            return { success: false, msg: "Invalid provider specified." };
          }

          if (!idToken) {
            return { success: false, msg: "ID Token is required." };
          }


          const backend_url =
            provider === "google"
              ? "/social_auth/google/"
              : "/social_auth/apple/";

          const response = await apiService.post(backend_url, {
            auth_token: idToken,
          });
          const data = response.data;

          if (response.success) {
            const { tokens, email: userEmail, username, user_id } = data;
            // Store tokens
            if (tokens?.access && tokens?.refresh) {
              await setItemAsync("accessToken", tokens.access);
              await setItemAsync("refreshToken", tokens.refresh);
            }

            // Store individual user fields
            if (userEmail) await setItemAsync("email", userEmail);
            if (username) await setItemAsync("username", username);
            if (user_id) await setItemAsync("user_id", user_id);

            // Create user object
            const userData: UserType = {
              user_id,
              email: userEmail,
              username,
            };

            await setItemAsync("userData", JSON.stringify(userData));

            const { isNewUser } = get();

            set({
              user: userData,
              isLoggedIn: true,
            });

            return {
              success: true,
              msg: "Login Successful",
              isNewUser,
            };
          } else {
            return {
              success: false,
              msg: "An error occurred. Please try again.",
            };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: "An unexpected error occurred. Please try again.",
          };
        }
      },

      // Register new user
      register: async (email: string, password: string, name: string) => {
        try {
          const response = await apiService.post("/auth/register/", {
            email,
            password,
            name,
          });
          const data = response.data;


          if (response.success) {
            set({ isNewUser: true });
            const msg = data?.data?.message;
            return { success: true, msg };
          } else {
            let msg = data?.message || "Registration failed";
            if (
              msg.includes("email-already-in-use") ||
              msg.includes("already exists")
            ) {
              msg = "This email is already in use";
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      verifyPasswordResetcode: async (email: string, code: string) => {
        if (!email || !code) {
          return {
            success: false,
            msg: "Email and verification code are required.",
          };
        }

        try {
          const response = await apiService.post("/auth/verify-reset-code/", {
            email,
            code,
          });
          const data = response.data;
          if (response.success) {
            return { success: true, verificationResponse: data };
          } else {
            let msg = data?.error || "Verification failed";
            if (
              msg.includes("Invalid verification code") ||
              msg.includes("verification code")
            ) {
              msg =
                "Invalid verification code. Please try again. attempts remaining" +
                (data?.attempts_remaining || "");
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Verify email
      verifyEmail: async (email: string, code: string) => {
        if (!email || !code) {
          return {
            success: false,
            msg: "Email and verification code are required.",
          };
        }

        try {
          const response = await apiService.post("/auth/verify-email/", {
            email,
            code,
          });
          const data = response.data;
          if (response.success) {
            return { success: true };
          } else {
            let msg = data?.error || "Verification failed";
            if (
              msg.includes("Invalid verification code") ||
              msg.includes("verification code")
            ) {
              msg =
                "Invalid verification code. Please try again. attempts remaining" +
                (data?.attempts_remaining || "");
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Resend verification code
      resendVerificationCode: async (email: string) => {
        if (!email) {
          return {
            success: false,
            msg: "Email is required to resend verification code.",
          };
        }

        try {
          const response = await apiService.post(
            "/auth/resend-verification-code/",
            { email }
          );
          const data = response.data;

          if (response.success) {
            const msg = data?.message;
            return { success: true, msg };
          } else {
            let msg = data?.error || "Unable to resend Token";
            if (
              msg.includes("email-already-in-use") ||
              msg.includes("already exists")
            ) {
              msg = "Verification failed, Try again later or contact support";
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Forgot password
      forgotPassword: async (email: string) => {
        try {
          const response = await apiService.post("/auth/request-reset-email/", {
            email,
          });
          const data = response.data;

          if (response.success) {
            return { success: true };
          } else {
            let msg = data?.message || "Failed to send reset email";
            if (msg.includes("user-not-found") || msg.includes("not found")) {
              msg = "This email is not registered";
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Reset password complete
      resetPasswordComplete: async (
        token: string,
        uidb64: string,
        newPassword: string
      ) => {
        try {
          const response = await apiService.patch(
            "/auth/password-reset-complete/",
            {
              password: newPassword,
              uidb64,
              token,
            }
          );
          const data = response.data;

          if (response.success) {
            return { success: true };
          } else {
            let msg = data?.message || "Password reset failed";
            if (msg.includes("invalid-code")) {
              msg = "Invalid verification code";
            }
            return { success: false, msg };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Update user data
      updateUserData: async () => {
        try {
          const accessToken = await getItemAsync("accessToken");
          if (!accessToken) {
            return { success: false, msg: "No access token found" };
          }

          const response = await apiService.get("/auth/user/");
          const data = response.data;

          if (response.success) {
            const userData: UserType = {
              user_id: data?.uid || data?.id,
              email: data?.email,
              full_name: data?.full_name || data?.user_fullname,
              phone_number: data?.phone_number,
              username: data?.username || data?.user_name,
              image: data?.image || data?.profile_image,
            };

            await setItemAsync("userData", JSON.stringify(userData));
            set({ user: userData });
            return { success: true };
          } else {
            return {
              success: false,
              msg: data?.message || "Failed to update user data",
            };
          }
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Network error. Please try again.",
          };
        }
      },

      // Logout
      logout: async () => {
        try {
          // Clear all stored data
          await deleteItemAsync("accessToken");
          await deleteItemAsync("refreshToken");
          await deleteItemAsync("userData");
          await deleteItemAsync("email");
          await deleteItemAsync("username");
          await deleteItemAsync("user_id");
          await deleteItemAsync("hasCompletedOnboarding");
          await deleteItemAsync("hasCompletedSourceSelection");
          await deleteItemAsync("selectedNewsSources");

          // Reset state
          set({
            user: null,
            isLoggedIn: false,
            hasCompletedOnboarding: false,
            isNewUser: false,
          });

          return { success: true };
        } catch (error: any) {
          return {
            success: false,
            msg: error?.message || "Logout failed",
          };
        }
      },

      // Complete onboarding
      completeOnboarding: async () => {
        await setItemAsync("hasCompletedOnboarding", "true");
        set({ hasCompletedOnboarding: true });
      },

   

      // Reset onboarding
      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false });
      },

    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => ({
        setItem: setItemAsync,
        getItem: getItemAsync,
        removeItem: deleteItemAsync,
      })),
      // Only persist simple state, not functions
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isNewUser: state.isNewUser,
      }),
    }
  )
);
