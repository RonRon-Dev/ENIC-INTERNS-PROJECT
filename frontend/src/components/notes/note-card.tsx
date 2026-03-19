"use client";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Archive, BookOpen, Clock, Trash2 } from "lucide-react";
import { useNote } from "./note-provider";
import { type Note } from "./types";

interface NoteCardProps {
  note: Note;
  src?: string;
}

export function NoteCard({ note }: NoteCardProps) {
  const { setOpen, setCurrentNote } = useNote();

  const handleAction = (type: "edit" | "delete" | "archive") => {
    setCurrentNote(note);
    setOpen(type);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="outline"
          onClick={() => handleAction("edit")}
          className="flex flex-col min-h-[150px] justify-start h-auto rounded-xl min-w-full text-left p-0 hover:bg-muted/5"
        >
          <div className="relative flex items-center justify-center w-full h-[80px] bg-muted-foreground/10 rounded-tl-xl rounded-tr-xl">
            {/* {src ? (
              <img src={src} alt="thumbnail-image" className="w-full h-full object-cover rounded-xl" />
            ) : ( */}
            <BookOpen className="absolute -bottom-4 left-10 !size-10" />
            {/* )} */}
          </div>
          <div className="p-8 py-6 pb-8 w-full gap-2 flex flex-col">
            <div className="font-black text-lg truncate w-full pl-2">
              {note.title || (
                <span className="text-muted-foreground">Untitled</span>
              )}
            </div>
            {/* <p className="text-muted-foreground text-sm truncate w-full">
              {note.description || "No description"}
            </p> */}

          </div>
          <div className="px-4 py-2.5 border-t  flex items-center w-full justify-end gap-4 ">
            <span className="text-muted-foreground text-xs mt-auto pl-2 flex items-center">
              <Clock className="inline-block mr-1 !size-3" />
              <span>modified {note.lastEdited ?? "2 mins ago"} ago</span>
            </span>
          </div>
        </Button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleAction("archive")}>
          <Archive size={14} className="mr-2" />
          Archive
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={() => handleAction("delete")}
        >
          <Trash2 size={14} className="mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}