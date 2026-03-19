"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const MAX = 40;

interface InlineHeaderInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function InlineHeaderInput({
  value,
  onChange,
  placeholder = "Untitled",
  className,
  inputClassName,
}: InlineHeaderInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= MAX) {
      onChange(e.target.value);
    }
  };

  const remaining = MAX - value.length;
  const isNearLimit = remaining <= 5;
  const isAtLimit = remaining === 0;

  const sharedClassName = cn(
    "w-full text-xl font-semibold text-foreground",
    className
  );

  return (
    <div onDoubleClick={() => setIsEditing(true)} className="cursor-text">
      {isEditing ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={MAX}
            className={cn(
              sharedClassName,
              "bg-transparent outline-none border-b border-border pb-0.5 pr-10",
              inputClassName
            )}
          />
          <span
            className={cn(
              "absolute right-0 bottom-1 text-xs tabular-nums transition-colors",
              isAtLimit
                ? "text-destructive font-medium"
                : isNearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground"
            )}
          >
            {remaining}
          </span>
        </div>
      ) : (
        <span className={cn(sharedClassName, "block truncate")}>
          {value || (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
      )}
    </div>
  );
}