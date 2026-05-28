import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:3000/api" });

// Attach JWT to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("ep_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── User Auth ────────────────────────────────────────────────────────────────
export const userSignup    = (data) => API.post("/user/signup", data);
export const userLogin     = (data) => API.post("/user/login", data);
export const getUserProfile = ()   => API.get("/user/profile");

// ─── Merchant Auth ────────────────────────────────────────────────────────────
export const merchantSignup    = (data) => API.post("/merchant/signup", data);
export const merchantLogin     = (data) => API.post("/merchant/login", data);
export const getMerchantProfile = ()   => API.get("/merchant/profile");

// ─── Payment Session (Merchant POS ↔ ESP32) ───────────────────────────────────
// Step 1 — merchant creates session
export const awaitTap = (data) => API.post("/tap/await", data);          // { amount, merchantId, deviceId }
// Step 2 — website polls for result (after ESP32 taps)
export const getPaymentResult = (deviceId) => API.get(`/tap/result?deviceId=${deviceId}`);
// Cancel
export const cancelTap = (deviceId) => API.delete(`/tap/pending?deviceId=${deviceId}`);
// (ESP32 uses GET /tap/pending directly — not called from website)

// ─── Card Registration Session (User Cards ↔ ESP32) ──────────────────────────
// Step 1 — user initiates registration (website creates session with userId)
export const startCardRegistration = (data) => API.post("/cards/registration-session", data);  // { userId, deviceId }
// Step 2 — website polls for result (after ESP32 taps card)
export const getRegistrationResult = (deviceId) => API.get(`/cards/registration-result?deviceId=${deviceId}`);
// Cancel
export const cancelCardRegistration = (deviceId) => API.delete(`/cards/registration-session?deviceId=${deviceId}`);

// ─── Manual card registration (fallback — user types UID) ────────────────────
export const registerCard = (data) => API.post("/cards/register", data);
export const getUserCards  = ()    => API.get("/cards/mine");

// ─── Direct tap (legacy / simulated) ─────────────────────────────────────────
export const processTap = (data) => API.post("/tap", data);

// ─── Top-Up ───────────────────────────────────────────────────────────────────
export const createTopupOrder    = (amount) => API.post("/topup/order", { amount });
export const verifyTopupPayment  = (data)   => API.post("/topup/verify", data);

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getUserTransactions     = () => API.get("/transactions/user");
export const getMerchantTransactions = () => API.get("/transactions/merchant");

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminStats        = () => API.get("/admin/stats");
export const getAdminTransactions = () => API.get("/admin/transactions");
export const getAdminUsers        = () => API.get("/admin/users");
export const getAdminMerchants    = () => API.get("/admin/merchants");

export default API;
