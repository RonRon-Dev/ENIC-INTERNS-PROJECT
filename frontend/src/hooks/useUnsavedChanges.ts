// ─── useUnsavedChanges ────────────────────────────────────────────────────────
// Works with legacy BrowserRouter (<Routes>) — does NOT require createBrowserRouter.
//
// Three layers:
//   1. beforeunload      — tab close, refresh, external navigation
//   2. pushState/replaceState intercept — in-app React Router link navigation
//   3. popstate listener — browser back/forward button AND window.history.back()
//
// Usage:
//   const { showBlocker, confirmLeave, cancelLeave } = useUnsavedChanges(hasData);
//
//   <ConfirmDialog
//     open={showBlocker}
//     title="Leave page?"
//     desc="..."
//     confirmText="Leave"
//     handleConfirm={confirmLeave}
//     onOpenChange={(v) => !v && cancelLeave()}
//   />

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useUnsavedChanges(isDirty: boolean, message?: string) {
  const msg = message ?? "You have unsaved changes. Leave anyway?";
  const navigate = useNavigate();
  const location = useLocation();

  const [showBlocker, setShowBlocker] = useState(false);
  const pendingPath = useRef<string | null>(null);
  const confirmedRef = useRef(false);

  // ── Layer 1: browser-level (tab close / refresh) ──────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = msg;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, msg]);

  // ── Layer 2: intercept pushState / replaceState ───────────────────────────
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
      const targetPath = target.startsWith("http")
        ? new URL(target).pathname
        : target;
      if (targetPath && targetPath !== location.pathname) {
        pendingPath.current = targetPath;
        setShowBlocker(true);
        return;
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

  // ── Layer 3: popstate (back/forward button, window.history.back()) ─────────
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: PopStateEvent) => {
      if (confirmedRef.current) {
        confirmedRef.current = false;
        return;
      }

      // Re-push the current state to cancel the browser navigation
      // so the URL stays on the current page while we show the dialog.
      history.pushState(e.state, "", location.pathname);

      // We don't know exactly where back() was going, so we store -1
      // as a sentinel meaning "go back one step after confirmation".
      pendingPath.current = "__back__";
      setShowBlocker(true);
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isDirty, location.pathname]);

  // ── Confirm / cancel ──────────────────────────────────────────────────────
  const confirmLeave = () => {
    setShowBlocker(false);
    if (pendingPath.current) {
      confirmedRef.current = true;
      if (pendingPath.current === "__back__") {
        // User confirmed after hitting browser back — actually go back now
        navigate(-1);
      } else {
        navigate(pendingPath.current);
      }
      pendingPath.current = null;
    }
  };

  const cancelLeave = () => {
    setShowBlocker(false);
    pendingPath.current = null;
  };

  return { showBlocker, confirmLeave, cancelLeave };
}
