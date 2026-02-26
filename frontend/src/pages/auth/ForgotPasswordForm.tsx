import { useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isSent ? "Request Logged" : "Recover Account"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isSent
            ? "Your request has been forwarded to the Admin for manual reset."
            : "Request a manual password reset from the MIS Administrator."}
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel>System Username</FieldLabel>
              <Input type="text" placeholder="eg. j.luna" required />
              <FieldDescription>
                Enter the username associated with your MIS account.
              </FieldDescription>
            </Field>
            <Button type="submit" className="w-full">
              Send Reset Request
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95 duration-300">
          <div className="bg-primary/10 p-3 rounded-full">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <p className="text-xs text-center text-muted-foreground max-w-[220px]">
            Please wait for an administrator to verify your identity and contact
            you.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to login
      </button>
    </div>
  );
}
