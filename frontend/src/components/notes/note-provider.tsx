"use client";

import React, { useState } from "react";
import { type Note } from "./types";

function useDialogState<T>(initial: T | null = null) {
  const [state, setState] = useState<T | null>(initial);
  return [state, setState] as const;
}

export type NoteDialogType = "edit" | "delete" | "archive";

type NoteContextType = {
  open: NoteDialogType | null;
  setOpen: (type: NoteDialogType | null) => void;
  currentNote: Note | null;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note | null>>;
};

const NoteContext = React.createContext<NoteContextType | null>(null);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<NoteDialogType>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);

  return (
    <NoteContext value={{ open, setOpen, currentNote, setCurrentNote }}>
      {children}
    </NoteContext>
  );
}

export function useNote() {
  const ctx = React.useContext(NoteContext);
  if (!ctx) throw new Error("useNote must be used within <NoteProvider>");
  return ctx;
}