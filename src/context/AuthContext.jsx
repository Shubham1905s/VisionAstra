import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mockDb } from "../services/mockDb";
import { generateOtp } from "../utils/validators";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    mockDb.seedAdminIfMissing();
    setUser(mockDb.getCurrentUser());
    setIsAuthReady(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      async sendOtp(email) {
        const otp = generateOtp();
        mockDb.storeOtp(email, otp);
        return otp;
      },
      async registerStudent(payload) {
        const created = mockDb.registerStudent(payload);
        return created;
      },
      async login(payload) {
        const loggedIn = mockDb.login(payload);
        setUser(loggedIn);
      },
      logout() {
        mockDb.logout();
        setUser(null);
      },
      refreshSession() {
        setUser(mockDb.getCurrentUser());
      },
      isAuthReady,
    }),
    [isAuthReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
