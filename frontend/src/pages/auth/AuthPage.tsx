"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LucideAtom, Copy, Check } from "lucide-react";
import { ForgotPasswordForm } from "@/pages/auth/ForgotPasswordForm";

type AuthMode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

  const isLeftView = mode === "login" || mode === "forgot";

  return (
    <div className="relative grid min-h-svh w-full lg:grid-cols-2 overflow-hidden bg-background">
      <div
        className={cn(
          "transition absolute top-6 left-6 md:top-10 md:left-10 z-[60] flex items-center gap-2 font-medium duration-500",
          isLeftView
            ? "translate-x-0 opacity-100"
            : "translate-x-[-10vw] opacity-0"
        )}
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground font-bold">ENIC - MIS</span>
      </div>

      <div
        className={cn(
          "transition absolute top-6 right-6 md:top-10 md:right-10 z-[60] flex items-center gap-2 font-medium duration-500",
          mode === "signup"
            ? "translate-x-0 opacity-100"
            : "translate-x-[10vw] opacity-0"
        )}
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground font-bold">ENIC - MIS</span>
      </div>

      {/* Left Slot: Login / Forgot Password */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div
            key={mode === "forgot" ? "forgot" : "login"}
            className={cn(
              "w-full max-w-xs transition-all duration-500 ease-in-out",
              isLeftView
                ? "opacity-100"
                : "opacity-20 pointer-events-none blur-sm"
            )}
          >
            {mode === "forgot" ? (
              <ForgotPasswordForm onBack={() => setMode("login")} />
            ) : (
              <LoginForm
                onToggleSignup={() => setMode("signup")}
                onToggleForgot={() => setMode("forgot")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Slot: Signup */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div
            className={cn(
              "w-full max-w-sm transition-all duration-500 ease-in-out",
              mode === "signup"
                ? "opacity-100"
                : "opacity-20 pointer-events-none blur-sm"
            )}
          >
            <SignupForm onToggle={() => setMode("login")} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-0 h-full w-1/2 hidden lg:block transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-50 p-5",
          isLeftView ? "translate-x-full" : "translate-x-0"
        )}
      >
        <div className="relative h-full w-full overflow-hidden shadow-2xl rounded-xl">
          <img
            src="/tektite.jpg"
            alt="MIS Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  onToggleSignup,
  onToggleForgot,
}: {
  onToggleSignup: () => void;
  onToggleForgot: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Login to your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials below
        </p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input type="text" placeholder="eg. j.luna" required />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Password</FieldLabel>
            <button
              type="button"
              onClick={onToggleForgot}
              className="text-xs underline underline-offset-4 hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <Input type="password" required />
        </Field>
        <Button className="w-full">Login</Button>
        <p className="text-center text-sm">
          New here?{" "}
          <button
            type="button"
            onClick={onToggleSignup}
            className="font-semibold underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </button>
        </p>
      </FieldGroup>
    </form>
  );
}

function SignupForm({ onToggle }: { onToggle: () => void }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (fullName.trim()) {
      const names = fullName.toLowerCase().trim().split(/\s+/);
      setUsername(
        names.length >= 2
          ? `${names[0].charAt(0)}.${names[names.length - 1]}`
          : names[0]
      );
    } else {
      setUsername("");
    }
  }, [fullName]);

  const copyUsername = () => {
    if (!username) return;
    navigator.clipboard.writeText(username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form
      className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Request Access</h1>
        <p className="text-muted-foreground text-sm">
          Create local system credentials
        </p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            placeholder="eg. Juan Luna"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel>System Username</FieldLabel>
          <div className="relative">
            <Input
              value={username}
              readOnly
              className="bg-muted/50 font-mono text-primary pr-10 cursor-default"
            />
            <button
              type="button"
              onClick={copyUsername}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded transition-colors"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <FieldDescription>
            Generated identifier for ENIC - MIS.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input type="password" required />
          </Field>
          <Field>
            <FieldLabel>Confirm</FieldLabel>
            <Input type="password" required />
          </Field>
        </div>
        <Button className="w-full mt-2">Submit Request</Button>
        <p className="text-center text-sm">
          Returning?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </button>
        </p>
      </FieldGroup>
    </form>
  );
}
