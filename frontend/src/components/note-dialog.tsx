"use client";

import { InlineDescInput } from "@/components/inline-editable-desc-input";
import { InlineHeaderInput } from "@/components/inline-editable-header-input";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Archive, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Note {
  title: string;
  description: string;
}

// ── Add mode ──────────────────────────────────────────────
interface AddModeProps {
  mode: "add";
  onSave?: (note: Note) => void;
}

// ── Edit mode ─────────────────────────────────────────────
interface EditModeProps {
  mode: "edit";
  initialTitle: string;
  initialDescription: string;
  lastEdited?: string;
  onSave?: (note: Note) => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

type NoteDialogProps = AddModeProps | EditModeProps;

export function NoteDialog(props: NoteDialogProps) {
  const isEdit = props.mode === "edit";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [description, setDescription] = useState(
    isEdit ? props.initialDescription : ""
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      props.onSave?.({ title, description });
      if (!isEdit) {
        setTitle("");
        setDescription("");
      }
    }
  };

  const trigger = isEdit ? (
    <Button
      variant="outline"
      className="flex flex-col min-h-[120px] h-auto rounded-xl min-w-full p-4 text-left"
    >
      <div className="font-black text-lg truncate w-full text-center">
        {title || <span className="text-muted-foreground">Untitled</span>}
      </div>
      <p className="text-muted-foreground text-sm truncate w-full text-center">
        {description || "No description"}
      </p>
      <span className="text-muted-foreground text-xs mt-auto">
        {props.lastEdited ?? "Last edited 2 mins ago"}
      </span>
    </Button>
  ) : (
    <Button className="w-fit">
      <Plus size={16} />
      Add Note
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isEdit ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={(e) => {
                e.stopPropagation();
                (props as EditModeProps).onArchive?.();
              }}
            >
              <Archive size={14} className="mr-2" />
              Archive
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                (props as EditModeProps).onDelete?.();
              }}
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader className="max-w-sm">
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
          className="w-full min-h-[200px] max-h-[400px] overflow-y-auto no-scrollbar"
        />
      </DialogContent>
    </Dialog>
  );
}