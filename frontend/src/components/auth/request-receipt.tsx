import { notifToast } from "@/lib/notifToast";
import { Check, CheckCircle2, ChevronLeft, Clock, Copy } from "lucide-react";
import { useState } from "react";

interface RequestReceiptFormProps {
  onBack: () => void;
  username?: string;
}

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  }
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'absolute'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export function RequestReceiptForm({ onBack, username }: RequestReceiptFormProps) {
  const [copied, setCopied] = useState(false);

  const copyUsername = async () => {
    if (!username) return
    try {
      await copyToClipboard(username)
      setCopied(true)
      notifToast({ reason: 'Username saved to clipboard' }, 'copy')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  const handleBack = () => {
    if (username) copyToClipboard(username).catch(() => { })
    onBack()
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Request Submitted</h1>
        <p className="text-muted-foreground text-sm">
          Your access request has been logged successfully.
        </p>
      </div>

      {/* Receipt Card */}
      <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-5">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
        </div>

        {/* Username */}
        {username && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-muted-foreground">Your system username</p>
            <p className="font-mono text-sm font-semibold text-primary bg-primary/10 px-3 pr-1 rounded-md">
              <div className="flex items-center my-2">
                {username}
                <button
                  type="button"
                  onClick={copyUsername}
                  className="p-1 ml-1 hover:bg-background rounded transition-colors"
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </p>
          </div>
        )}

        <div className="border-t pt-4 flex items-start gap-3">
          <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Your request is pending review. Once approved, you can log in using your system username and the password you set.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to login
      </button>
    </div>
  );
}