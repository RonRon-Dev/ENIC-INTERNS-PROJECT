"use client";

import { useAuth } from "@/auth-context";
import { AddNoteDialog } from "@/components/notes/note-action-dialogs";
import { NoteCard } from "@/components/notes/note-card";
import { NoteDialogs } from "@/components/notes/note-dialogs";
import { NoteProvider } from "@/components/notes/note-provider";
import type { Note } from "@/components/notes/types";


const MOCK_NOTES: Note[] = [
  { id: "1", title: "Project 1", description: "Some notes here", lastEdited: "2 mins" },
  { id: "2", title: "Meeting", description: "Action items", lastEdited: "1 hour" },
];

export default function DynamicDashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "User";
  const fullName = user?.name ?? "";
  const role = user?.roleName ?? "";
  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const subtitle = role
    ? `Here's what's on your plate, ${firstName}.`
    : "Welcome to your dashboard.";
  const handleSave = (note: Note) => console.log("saved", note);
  const handleDelete = (note: Note) => console.log("deleted", note.id);
  const handleArchive = (note: Note) => console.log("archived", note.id);

  return (
    <>
      <NoteProvider>
        <div className="text-right">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 gap-6">
              {/* Left — title + subtitle */}
              <h1 className="text-xl font-bold tracking-tight">{subtitle}</h1>

              {/* Right — user info + add button */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Add Note — visible to all roles */}
                <AddNoteDialog
                  onSave={(note) => {
                    const newNote: Note = {
                      ...note,
                      id: crypto.randomUUID(),
                      lastEdited: "Just now",
                    };
                    onAddNote?.(newNote as Omit<Note, "id" | "lastEdited">);
                  }}
                />
              </div>
            </div>

            <div className="px-7 py-2.5 border-t bg-muted/20 flex items-center justify-between gap-4">
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 py-6">
            {MOCK_NOTES.map((note) => (
              <NoteCard key={note.id} note={note} src="" />
            ))}
          </div>

          {/* Mount once at the top level — handles all dialog rendering */}
          <NoteDialogs
            onSave={handleSave}
            onDelete={handleDelete}
            onArchive={handleArchive}
          />
        </div>
      </NoteProvider>
    </>
  );
}
