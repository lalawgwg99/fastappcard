import { Member, User } from "../types";

// ------------------------------------------------------------------
// 這是一個模擬後端 (Mock Backend)。
// 在正式產品中，請將這裡的邏輯替換為 fetch() 呼叫您的 Cloudflare Worker 或 Supabase SDK。
// ------------------------------------------------------------------

const SIMULATED_CLOUD_DELAY = 600; // 模擬網路延遲

// 模擬雲端資料庫 (實際上存在 localStorage 的另一個 Key 下)
const getCloudKey = (username: string) => `checkout-swift-cloud-db-${username}`;

export const mockAuthService = {
  // 模擬登入
  login: async (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!username || !password) {
          reject(new Error("請輸入帳號與密碼"));
          return;
        }
        // 為了演示方便，任何非空帳密都允許登入
        // 實際專案請連接 Auth Provider
        resolve({
          username: username,
          token: "mock-jwt-token-" + Date.now()
        });
      }, SIMULATED_CLOUD_DELAY);
    });
  },

  // 模擬註冊 (在此演示中，登入即註冊)
  register: async (username: string, password: string): Promise<User> => {
    return mockAuthService.login(username, password);
  },

  // 模擬從雲端讀取資料
  fetchUserData: async (user: User): Promise<{ members: Member[], storeName: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = getCloudKey(user.username);
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            resolve(data);
          } catch {
            resolve({ members: [], storeName: '' });
          }
        } else {
          // 新帳號回傳空資料
          resolve({ members: [], storeName: '' });
        }
      }, SIMULATED_CLOUD_DELAY);
    });
  },

  // 模擬儲存資料到雲端
  saveUserData: async (user: User, data: { members: Member[], storeName: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const key = getCloudKey(user.username);
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[Cloud Sync] Saved data for user: ${user.username}`);
        resolve(true);
      }, SIMULATED_CLOUD_DELAY);
    });
  }
};