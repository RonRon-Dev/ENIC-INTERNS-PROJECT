/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { authenticationApi } from "@/services/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

type User = {
  name: string;
  userName: string;
  nameIdentifier: string;
  roleName?: string;
  forcePasswordChange: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  sessionExpiredReason: string | null;
  idleSecondsLeft: number | null;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  dismissSessionExpired: () => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const COUNTDOWN_SECONDS = 60;

// const IDLE_TIMEOUT_MS = 10 * 1000;
// const COUNTDOWN_SECONDS = 10;

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

async function getAuthenticatedUser() {
  const data = await authenticationApi.getIam();
  return {
    name: data.name,
    userName: data.userName,
    nameIdentifier: data.nameIdentifier,
    roleName: data.roleName,
    forcePasswordChange: data.forcePasswordChange,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState<string | null>(null);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState<number | null>(null);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const countdownValueRef = useRef<number>(COUNTDOWN_SECONDS);
  const userRef = useRef<User | null>(null);

  const hasExpiredRef = useRef(false);

  const isInitializingRef = useRef(true);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIdleSecondsLeft(null);
    countdownValueRef.current = COUNTDOWN_SECONDS;
  }, []);

  const triggerSessionExpired = useCallback(async (reason?: string) => {
    if (hasExpiredRef.current) return;
    hasExpiredRef.current = true;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = null;
    setIdleSecondsLeft(null);

    authenticationApi.logout().catch(() => {});

    setUser(null);
    setSessionExpiredReason(reason ?? "Your session has expired due to inactivity. Please log in again to continue.");
    setSessionExpired(true);
  }, []);

  const startCountdown = useCallback(() => {
    stopCountdown();
    countdownValueRef.current = COUNTDOWN_SECONDS;
    setIdleSecondsLeft(COUNTDOWN_SECONDS);

    countdownIntervalRef.current = setInterval(() => {
      countdownValueRef.current -= 1;
      setIdleSecondsLeft(countdownValueRef.current);

      if (countdownValueRef.current <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        triggerSessionExpired();
      }
    }, 1000);
  }, [stopCountdown, triggerSessionExpired]);

  const resetIdleTimer = useCallback(() => {
    if (!userRef.current) return;
    if (countdownIntervalRef.current) stopCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, IDLE_TIMEOUT_MS);
  }, [stopCountdown, startCountdown]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuthenticatedUser();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
    setSessionExpiredReason(null);
    hasExpiredRef.current = false;
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    refreshUser().finally(() => {
      isInitializingRef.current = false;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for session:expired from api.ts interceptor ───────────────────

  useEffect(() => {
    const handler = (event: Event) => {
      if (isInitializingRef.current) return;
      const customEvent = event as CustomEvent<{ reason?: string }>;
      triggerSessionExpired(customEvent.detail?.reason);
    };
    window.addEventListener("session:expired", handler);
    return () => window.removeEventListener("session:expired", handler);
  }, [triggerSessionExpired]);

  // ── Idle detection ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      stopCountdown();
      return;
    }

    hasExpiredRef.current = false;

    const EVENTS = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    EVENTS.forEach((e) =>
      window.addEventListener(e, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      stopCountdown();
    };
  }, [user, resetIdleTimer, stopCountdown]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        sessionExpired,
        sessionExpiredReason,
        idleSecondsLeft,
        refreshUser,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
