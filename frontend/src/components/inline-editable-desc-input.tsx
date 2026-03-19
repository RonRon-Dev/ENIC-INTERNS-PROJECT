"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, List } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface InlineDescInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineDescInput({
  value,
  onChange,
  placeholder = "Add a description…",
  className,
}: InlineDescInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBullet, setIsBullet] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isEditing) {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      autoResize();
    }
  }, [isEditing]);

  // Check if display div is scrollable
  const checkScroll = () => {
    const el = displayRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setShowScrollHint(scrollable && !atBottom);
  };

  useEffect(() => {
    if (!isEditing) {
      // Small delay to let the DOM settle
      requestAnimationFrame(checkScroll);
    }
  }, [isEditing, value]);

  const syncBulletState = () => {
    const el = textareaRef.current;
    if (!el) return;
    const lines = value.split("\n");
    const cursorPos = el.selectionStart;
    let charCount = 0;
    for (const line of lines) {
      charCount += line.length + 1;
      if (cursorPos < charCount) {
        setIsBullet(line.startsWith("• "));
        break;
      }
    }
  };

  const toggleBullet = () => {
    const el = textareaRef.current;
    if (!el) return;

    const lines = value.split("\n");
    const cursorPos = el.selectionStart;

    let charCount = 0;
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1;
      if (cursorPos < charCount) {
        lineIndex = i;
        break;
      }
    }

    const currentLine = lines[lineIndex];
    const hasBullet = currentLine.startsWith("• ");

    if (hasBullet) {
      lines[lineIndex] = currentLine.slice(2);
      setIsBullet(false);
    } else {
      lines[lineIndex] = `• ${currentLine}`;
      setIsBullet(true);
    }

    onChange(lines.join("\n"));
    requestAnimationFrame(() => {
      el.focus();
      autoResize();
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    autoResize();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (e.shiftKey) {
        setIsEditing(false);
        return;
      }

      const el = textareaRef.current!;
      const { selectionStart, selectionEnd } = el;
      const insert = isBullet ? "\n• " : "\n";
      const next =
        value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + insert.length;
        autoResize();
      });
    }
  };

  const renderDisplay = () => {
    if (!value)
      return <span className="text-muted-foreground">{placeholder}</span>;
    return value.split("\n").map((line, i) => (
      <span key={i} className="block text-muted-foreground">
        {line || <br />}
      </span>
    ));
  };

  const sharedClassName = cn(
    "w-full text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words",
    className
  );

  return (
    <div onDoubleClick={() => setIsEditing(true)} className="cursor-text max-w-full min-w-0">
      {isEditing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            onKeyUp={syncBulletState}
            onClick={syncBulletState}
            placeholder={placeholder}
            rows={1}
            className={cn(
              sharedClassName,
              "resize-none overflow-hidden bg-transparent outline-none",
              "border-b border-border pb-0.5 placeholder:text-muted-foreground"
            )}
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleBullet}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors",
                isBullet
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <List size={11} />
              {/* Bullet */}
            </button>
            <span className="text-xs text-muted-foreground">
              Enter for new line · Shift+Enter to save
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={displayRef}
            onScroll={checkScroll}
            className={sharedClassName}
          >
            {renderDisplay()}
          </div>

          {/* Scroll hint arrow */}
          {showScrollHint && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
              {/* Fade gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
              <ChevronDown
                size={14}
                className="relative z-10 text-muted-foreground animate-bounce"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}