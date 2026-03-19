"use client";

import {
  ArchiveNoteDialog,
  DeleteNoteDialog,
  EditNoteDialog,
} from "./note-action-dialogs";
import { useNote } from "./note-provider";
import { type Note } from "./types";

interface NoteDialogsProps {
  onSave?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onArchive?: (note: Note) => void;
}

export function NoteDialogs({ onSave, onDelete, onArchive }: NoteDialogsProps) {
  const { open, setOpen, currentNote, setCurrentNote } = useNote();

  const handleClose = () => {
    setOpen(null);
    setTimeout(() => setCurrentNote(null), 300); // wait for dialog close animation
  };

  if (!currentNote) return null;

  return (
    <>
      <EditNoteDialog
        key={`note-edit-${currentNote.id}`}
        open={open === "edit"}
        onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
        currentNote={currentNote}
        onSave={onSave}
      />

      <DeleteNoteDialog
        key={`note-delete-${currentNote.id}`}
        open={open === "delete"}
        onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
        currentNote={currentNote}
        onConfirm={onDelete}
      />

      <ArchiveNoteDialog
        key={`note-archive-${currentNote.id}`}
        open={open === "archive"}
        onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
        currentNote={currentNote}
        onConfirm={onArchive}
      />
    </>
  );
}