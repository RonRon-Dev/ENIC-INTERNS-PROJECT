"use client";

import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList
} from "@/components/ui/file-upload";
import { ImageIcon, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

interface ImageDropzoneProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export function ImageDropzone({
  value,
  onChange,
  maxFiles = 4,
  maxSize = 4 * 1024 * 1024,
}: ImageDropzoneProps) {
  const [files, setFiles] = React.useState<File[]>(value ?? []);

  const handleValueChange = (next: File[]) => {
    setFiles(next);
    onChange?.(next);
  };

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast.error(message, {
      description: `"${file.name}" was rejected`,
    });
  }, []);

  return (
    <FileUpload
      accept="image/*"
      maxFiles={maxFiles}
      maxSize={maxSize}
      className="w-full"
      value={files}
      onValueChange={handleValueChange}
      onFileReject={onFileReject}
      multiple
    >
      <FileUploadDropzone className="border-none bg-muted rounded-none rounded-tl-lg rounded-tr-lg data-dragging:bg-primary/10">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary/10 p-3">
            <ImageIcon className="size-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Upload images</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        </div>
        {/* <FileUploadTrigger asChild>
          <Button size="sm" className="mt-3">
            Select Images
          </Button>
        </FileUploadTrigger> */}
      </FileUploadDropzone>

      <FileUploadList>
        {files.map((file, index) => (
          <FileUploadItem key={index} value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X className="size-4" />
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}