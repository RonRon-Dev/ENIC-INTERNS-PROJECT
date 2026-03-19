"use client";

import { InlineDescInput } from "@/components/inline-editable-desc-input";
import { InlineHeaderInput } from "@/components/inline-editable-header-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Archive, BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { type Note } from "./types";

// ── Shared inner content ──────────────────────────────────

interface NoteDialogContentProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  lastEdited?: string;
  lastEditedBy?: string;
}

function NoteDialogContent({
  title,
  setTitle,
  description,
  setDescription,
  lastEdited,
  lastEditedBy,
}: NoteDialogContentProps) {
  return (
    <DialogContent className="max-w-2xl p-0">
      {/* Thumbnail */}
      <div className="flex items-center justify-center w-full h-[150px] bg-muted-foreground/10 rounded-tl-lg rounded-tr-lg">
        <BookOpen className="w-8 h-8" />
      </div>

      <div className="p-6 pt-0">
        <DialogHeader className="max-w-full mb-2">
          <DialogTitle>
            <InlineHeaderInput
              value={title}
              onChange={setTitle}
              placeholder="Untitled"
            />
          </DialogTitle>
        </DialogHeader>

        <InlineDescInput
          value={description}
          onChange={setDescription}
          placeholder="Add a description…"
          className="w-full min-h-[300px] max-h-[400px] overflow-y-auto no-scrollbar"
        />

        {(lastEdited || lastEditedBy) && (
          <div className="flex justify-between w-full mt-4">
            <p className="text-xs text-muted-foreground">
              Last edited by{" "}
              <span className="font-medium text-foreground">
                {lastEditedBy ?? "Unknown User"}.
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {lastEdited ? `${lastEdited} ago` : "Just now"}
            </p>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

// ── Edit Dialog ───────────────────────────────────────────

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNote: Note;
  onSave?: (note: Note) => void;
}

export function EditNoteDialog({
  open,
  onOpenChange,
  currentNote,
  onSave,
}: EditNoteDialogProps) {
  const [title, setTitle] = useState(currentNote.title);
  const [description, setDescription] = useState(currentNote.description);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) onSave?.({ ...currentNote, title, description });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <NoteDialogContent
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        lastEdited={currentNote.lastEdited}
        lastEditedBy={undefined} // swap with user?.fullName
      />
    </Dialog>
  );
}

// ── Add Dialog ────────────────────────────────────────────

interface AddNoteDialogProps {
  onSave?: (note: Omit<Note, "id" | "lastEdited">) => void;
}

export function AddNoteDialog({ onSave }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      if (title || description) onSave?.({ title, description });
      setTitle("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-fit">
          <Plus size={16} />
          Add Note
        </Button>
      </DialogTrigger>

      <NoteDialogContent
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
      />
    </Dialog>
  );
}

// ── Delete Dialog ─────────────────────────────────────────

interface DeleteNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNote: Note;
  onConfirm?: (note: Note) => void;
}

export function DeleteNoteDialog({
  open,
  onOpenChange,
  currentNote,
  onConfirm,
}: DeleteNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 size={16} className="text-destructive" />
            Delete Note
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {currentNote.title || "Untitled"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm?.(currentNote);
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Archive Dialog ────────────────────────────────────────

interface ArchiveNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNote: Note;
  onConfirm?: (note: Note) => void;
}

export function ArchiveNoteDialog({
  open,
  onOpenChange,
  currentNote,
  onConfirm,
}: ArchiveNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive size={16} />
            Archive Note
          </DialogTitle>
          <DialogDescription>
            Archive{" "}
            <span className="font-medium text-foreground">
              {currentNote.title || "Untitled"}
            </span>
            ? You can restore it from archives later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm?.(currentNote);
              onOpenChange(false);
            }}
          >
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}