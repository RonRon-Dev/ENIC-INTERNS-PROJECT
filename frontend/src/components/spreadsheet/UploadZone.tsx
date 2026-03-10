import { FileSpreadsheet } from "lucide-react";
import { useRef, useState } from "react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  progress: number;
  isLoading: boolean;
}

export function UploadZone({ onFile, progress, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div
        className={`
          w-full max-w-lg flex flex-col items-center justify-center gap-5
          rounded-2xl border-2 border-dashed px-10 py-14
          transition-all duration-300
          ${
            isLoading
              ? "border-border cursor-default"
              : isDragging
              ? "border-primary bg-primary/5 scale-[1.015] cursor-pointer"
              : "border-border hover:border-primary/50 hover:bg-muted/20 cursor-pointer"
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <div
          className={`rounded-2xl border p-5 transition-colors duration-300 ${
            isDragging
              ? "border-primary/40 bg-primary/10"
              : "border-border bg-muted/50"
          }`}
        >
          <FileSpreadsheet
            className={`h-9 w-9 transition-colors duration-300 ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>

        <div className="text-center flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {isLoading
              ? "Importing file…"
              : isDragging
              ? "Release to import"
              : "Drop your spreadsheet here"}
          </p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {isDragging
                ? "Supported: .xlsx · .xls · .csv"
                : "or click to browse · .xlsx, .xls, .csv"}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="w-full flex flex-col gap-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>Reading file</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </div>
  );
}
