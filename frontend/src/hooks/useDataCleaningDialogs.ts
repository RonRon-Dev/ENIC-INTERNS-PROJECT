// ─── useDataCleaningDialogs ───────────────────────────────────────────────────
// Centralises the five dialog open/close flags that previously lived as raw
// useState calls inside DataCleaningPage.
//
// Each dialog gets a dedicated open flag plus named open/close callbacks so
// the page and sub-components never call raw setState directly.

import { useCallback, useState } from "react";

export function useDataCleaningDialogs() {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showColDialog, setShowColDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  // ── Filter panel ────────────────────────────────────────────────────────────
  const openFilterPanel = useCallback(() => setShowFilterPanel(true), []);
  const closeFilterPanel = useCallback(() => setShowFilterPanel(false), []);
  const toggleFilterPanel = useCallback(
    () => setShowFilterPanel((v) => !v),
    []
  );

  // ── Column dialog ───────────────────────────────────────────────────────────
  const openColDialog = useCallback(() => setShowColDialog(true), []);
  const closeColDialog = useCallback(() => setShowColDialog(false), []);

  // ── Export dialog ───────────────────────────────────────────────────────────
  const openExportDialog = useCallback(() => setShowExportDialog(true), []);
  const closeExportDialog = useCallback(() => setShowExportDialog(false), []);

  // ── Clear-selection confirm ─────────────────────────────────────────────────
  const openClearConfirm = useCallback(() => setShowClearConfirm(true), []);
  const closeClearConfirm = useCallback(() => setShowClearConfirm(false), []);

  // ── Replace-file confirm ────────────────────────────────────────────────────
  const openReplaceConfirm = useCallback(() => setShowReplaceConfirm(true), []);
  const closeReplaceConfirm = useCallback(
    () => setShowReplaceConfirm(false),
    []
  );

  return {
    // state
    showFilterPanel,
    showColDialog,
    showExportDialog,
    showClearConfirm,
    showReplaceConfirm,
    // actions
    openFilterPanel,
    closeFilterPanel,
    toggleFilterPanel,
    openColDialog,
    closeColDialog,
    openExportDialog,
    closeExportDialog,
    openClearConfirm,
    closeClearConfirm,
    openReplaceConfirm,
    closeReplaceConfirm,
  };
}
