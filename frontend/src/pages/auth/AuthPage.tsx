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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="relative grid min-h-svh w-full lg:grid-cols-2 overflow-hidden bg-background">
      {/* Branding - fixed position */}
      <div
        className={cn(
          "transition absolute top-6 left-6 md:top-10 md:left-10 z-[60] flex items-center gap-2 font-medium duration-500",
          isLogin ? "translate-x-0" : "translate-x-[-10vw] opacity-0"
        )}
      >
        <div
          className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
        >
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground">ENIC - MIS</span>
      </div>

      <div
        className={cn(
          "transition absolute top-6 right-6 md:top-10 md:right-10 z-[60] flex items-center gap-2 font-medium duration-500",
          isLogin ? "translate-x-[110vw] opacity-0" : "translate-x-0"
        )}
      >
        <div
          className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
        >
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground">ENIC - MIS</span>
      </div>

      {/* <div
        className={cn(
          "absolute top-6 md:top-10 z-[60] flex items-center gap-2 font-medium transition-all duration-500 ease-in-out",
          isLogin
            ? "left-6 md:left-10 translate-x-0"
            : "right-6 md:right-10 translate-x-0"
        )}
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground">ENIC - MIS</span>
      </div> */}

      {/* Left Slot: Login */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div
            className={cn(
              "w-full max-w-xs transition-all duration-500 ease-in-out",
              isLogin
                ? "opacity-100"
                : "opacity-50 pointer-events-none"
            )}
          >
            <LoginForm onToggle={() => setIsLogin(false)} />
          </div>
        </div>
      </div>

      {/* Right Slot: Signup */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div
            className={cn(
              "w-full max-w-sm transition-all duration-500 ease-in-out",
              !isLogin
                ? "opacity-100"
                : "opacity-50 pointer-events-none"
            )}
          >
            <SignupForm onToggle={() => setIsLogin(true)} />
          </div>
        </div>
      </div>

      {/* Sliding Overlay */}
      <div
        className={cn(
          "absolute top-0 h-full w-1/2 hidden lg:block transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-50 p-5",
          isLogin ? "translate-x-full" : "translate-x-0"
        )}
      >
        <div className={cn("relative h-full w-full overflow-hidden shadow-2xl",)}>
          <img
            src="/tektite.jpg"
            alt="MIS Background"
            className={cn(
              "transition absolute inset-0 h-full w-full object-cover duration-1000 rounded-md",
            )}
          />
          <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent duration-1000 rounded-md",
          )}
          />

          {/* <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white text-center">
            <h2
              className={cn(
                "text-4xl font-bold mb-4 transition-all duration-700 delay-100",
                isLogin ? "translate-x-0" : "translate-x-0"
              )}
            >
              {isLogin ? "Welcome Back!" : "Join the MIS Team"}
            </h2>
            <p className="text-lg opacity-90 max-w-md">
              {isLogin
                ? "Access the ENIC management information system and stay updated."
                : "Request access to start managing system assets and automation."}
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onToggle }: { onToggle: () => void }) {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
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
              className="text-xs underline underline-offset-4"
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
            onClick={onToggle}
            className="font-semibold underline underline-offset-4"
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
      if (names.length >= 2) {
        const firstInitial = names[0].charAt(0);
        const lastName = names[names.length - 1];
        setUsername(`${firstInitial}.${lastName}`);
      } else {
        setUsername(names[0]);
      }
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
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Request Access</h1>
        <p className="text-muted-foreground text-sm">
          Create local system credentials
        </p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="signup-name">Full Name</FieldLabel>
          <Input
            id="signup-name"
            placeholder="eg. Juan Luna"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="signup-user">System Username</FieldLabel>
          <div className="relative">
            <Input
              id="signup-user"
              value={username}
              // readOnly
              className="bg-muted/50 font-mono text-primary pr-10 cursor-default"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={copyUsername}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded transition-colors"
              title="Copy username"
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
            <FieldLabel htmlFor="signup-pass">Password</FieldLabel>
            <Input id="signup-pass" type="password" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="signup-confirm">Confirm</FieldLabel>
            <Input id="signup-confirm" type="password" required />
          </Field>
        </div>

        <Button className="w-full mt-2">Submit Request</Button>
        <p className="text-center text-sm">
          Returning?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold underline underline-offset-4"
          >
            Sign in
          </button>
        </p>
      </FieldGroup>
    </form>
  );
}
