// ─── useUnsavedChanges ────────────────────────────────────────────────────────
// Works with legacy BrowserRouter (<Routes>) — does NOT require createBrowserRouter.
//
// Two layers:
//   1. beforeunload  — tab close, refresh, external navigation
//   2. Manual history intercept — in-app React Router navigation
//
// Usage:
//   const { showBlocker, confirmLeave, cancelLeave } = useUnsavedChanges(hasData);
//
//   <ConfirmDialog
//     open={showBlocker}
//     title="Leave page?"
//     description="..."
//     confirmLabel="Leave"
//     onConfirm={confirmLeave}
//     onClose={cancelLeave}
//   />

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useUnsavedChanges(isDirty: boolean, message?: string) {
  const msg = message ?? "You have unsaved changes. Leave anyway?";
  const navigate = useNavigate();
  const location = useLocation();

  const [showBlocker, setShowBlocker] = useState(false);
  // Store the intended destination so we can proceed after confirmation
  const pendingPath = useRef<string | null>(null);
  // Flag to allow navigation after user confirms
  const confirmedRef = useRef(false);

  // ── Layer 1: browser-level (tab close / refresh) ──
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = msg;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, msg]);

  // ── Layer 2: intercept pushState / replaceState ──
  // We patch history.pushState and history.replaceState to intercept
  // in-app navigation before the route changes.
  useEffect(() => {
    if (!isDirty) return;

    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    const intercept = (
      original: typeof history.pushState,
      state: unknown,
      unused: string,
      url?: string | URL | null
    ) => {
      if (confirmedRef.current) {
        confirmedRef.current = false;
        return original(state, unused, url);
      }

      const target = url ? String(url) : "";
      // Only block navigation away from current path
      const targetPath = target.startsWith("http")
        ? new URL(target).pathname
        : target;

      if (targetPath && targetPath !== location.pathname) {
        pendingPath.current = targetPath;
        setShowBlocker(true);
        return; // block navigation
      }

      return original(state, unused, url);
    };

    history.pushState = (state, unused, url) =>
      intercept(originalPush, state, unused, url);
    history.replaceState = (state, unused, url) =>
      intercept(originalReplace, state, unused, url);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, [isDirty, location.pathname]);

  const confirmLeave = () => {
    setShowBlocker(false);
    if (pendingPath.current) {
      confirmedRef.current = true;
      navigate(pendingPath.current);
      pendingPath.current = null;
    }
  };

  const cancelLeave = () => {
    setShowBlocker(false);
    pendingPath.current = null;
  };

  return { showBlocker, confirmLeave, cancelLeave };
}
