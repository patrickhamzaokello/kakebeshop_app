import apiService from "@/utils/apiBase";

export const phoneService = {
  addPhone: (phone: string) =>
    apiService.post("/auth/phone/add/", { phone }),
  verifyPhone: (code: string) =>
    apiService.post("/auth/phone/verify/", { code }),
  resendVerification: (phone: string) =>
    apiService.post("/auth/phone/resend/", { phone }),
  getStatus: () => apiService.get("/auth/phone/status/"),
  updatePhone: (phone: string) =>
    apiService.put("/auth/phone/update/", { phone }),
  removePhone: () => apiService.delete("/auth/phone/remove/"),
};
