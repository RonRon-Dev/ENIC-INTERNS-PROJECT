import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ColVisibility } from "@/types/spreadsheet";
import { Columns3, GripVertical, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ColumnDialogProps {
  open: boolean;
  columns: string[];
  visibility: ColVisibility;
  onChange: (col: string, v: boolean) => void;
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}

export function ColumnDialog({
  open,
  columns,
  visibility,
  onChange,
  onReorder,
  onClose,
}: ColumnDialogProps) {
  const [localVisibility, setLocalVisibility] = useState<ColVisibility>({});
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setLocalVisibility({ ...visibility });
      setLocalOrder(columns.filter((c) => visibility[c] !== false));
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToggle = (col: string) => {
    const isCurrentlyVisible = localVisibility[col] !== false;
    const isNowVisible = !isCurrentlyVisible;
    setLocalVisibility((prev) => ({ ...prev, [col]: isNowVisible }));
    setLocalOrder((prev) =>
      isNowVisible ? [...prev, col] : prev.filter((c) => c !== col)
    );
  };

  const handleShowAll = () => {
    setLocalVisibility(Object.fromEntries(columns.map((c) => [c, true])));
    setLocalOrder((prev) => {
      const existing = new Set(prev);
      return [...prev, ...columns.filter((c) => !existing.has(c))];
    });
  };

  const handleHideAll = () => {
    setLocalVisibility(Object.fromEntries(columns.map((c) => [c, false])));
    setLocalOrder([]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOver.current !== null &&
      dragItem.current !== dragOver.current
    ) {
      const next = [...localOrder];
      const [moved] = next.splice(dragItem.current, 1);
      next.splice(dragOver.current, 0, moved);
      setLocalOrder(next);
    }
    dragItem.current = null;
    dragOver.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const handleApply = () => {
    Object.entries(localVisibility).forEach(([col, v]) => onChange(col, v));
    const hidden = columns.filter((c) => localVisibility[c] === false);
    onReorder([...localOrder, ...hidden]);
    onClose();
  };

  const filtered = search.trim()
    ? columns.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : columns;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            Configure Columns
          </DialogTitle>
          <DialogDescription className="text-xs">
            Check columns to show them · drag on the right to reorder
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[420px]">
          {/* Left: all columns */}
          <div className="flex flex-col w-1/2 border-r border-border">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                All columns
              </span>
              <div className="flex gap-2 text-[11px]">
                <button
                  onClick={handleShowAll}
                  className="text-primary hover:underline"
                >
                  All
                </button>
                <button
                  onClick={handleHideAll}
                  className="text-muted-foreground hover:underline"
                >
                  None
                </button>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  className="w-full rounded-md border border-border bg-background pl-8 pr-7 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.map((col) => {
                const isVisible = localVisibility[col] !== false;
                return (
                  <div
                    key={col}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleToggle(col)}
                  >
                    <div
                      className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${
                        isVisible
                          ? "border-primary bg-primary"
                          : "border-border group-hover:border-muted-foreground/40"
                      }`}
                    >
                      {isVisible && (
                        <svg
                          viewBox="0 0 10 8"
                          fill="none"
                          className="w-2.5 h-2.5"
                        >
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-xs truncate transition-colors ${
                        isVisible
                          ? "text-foreground/80"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {col}
                    </span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground/40 text-center py-8">
                  No columns found
                </p>
              )}
            </div>
          </div>

          {/* Right: display order */}
          <div className="flex flex-col w-1/2">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Display order
              </span>
              <span className="text-[11px] text-muted-foreground">
                {localOrder.length} selected
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {localOrder.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                  <Columns3 className="h-6 w-6 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/40">
                    Check columns on the left to add them here
                  </p>
                </div>
              ) : (
                localOrder.map((col, i) => {
                  const isDragging = draggingIndex === i;
                  const isOver = overIndex === i && draggingIndex !== i;
                  return (
                    <div
                      key={col}
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md select-none transition-all duration-100 ${
                        isDragging ? "opacity-30" : "opacity-100"
                      } ${
                        isOver
                          ? "bg-primary/8 border border-primary/30"
                          : "border border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[10px] font-mono w-4 text-right text-muted-foreground/30 shrink-0">
                        {i + 1}
                      </span>
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing" />
                      <span className="text-xs text-foreground/80 flex-1 truncate">
                        {col}
                      </span>
                      <button
                        className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(col);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
