"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LucideAtom } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import SignupForm from "@/components/auth/signup-form";
import { RequestReceiptForm } from "@/components/auth/request-receipt";

type AuthMode = "login" | "signup" | "forgot" | "receipt";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [signedUpUsername, setSignedUpUsername] = useState<string>("")

  const isLeftView = mode === "login" || mode === "forgot";
  const isRightView = mode === "signup" || mode === "receipt";

  return (
    <div className="relative grid min-h-svh w-full lg:grid-cols-2 overflow-hidden bg-background">
      <div
        className={cn(
          "transition absolute top-6 left-6 md:top-10 md:left-10 z-[60] flex items-center gap-2 font-medium duration-500",
          isLeftView
            ? "translate-x-0 opacity-100"
            : "translate-x-[-10vw] opacity-0",
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
          isRightView
            ? "translate-x-0 opacity-100"
            : "translate-x-[10vw] opacity-0",
        )}
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <LucideAtom className="size-4" />
        </div>
        <span className="text-foreground font-bold">ENIC - MIS</span>
      </div>

      {/* Left Slot: Login / Forgot Password */}
      <div className="flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div
            key={mode === "forgot" ? "forgot" : "login"}
            className={cn(
              "w-full max-w-sm transition-all duration-500 ease-in-out",
              isLeftView
                ? "opacity-100"
                : "opacity-20 pointer-events-none blur-sm",
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

      {/* Right Slot: Signup / Receipt */}
      <div className="flex flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div
            className={cn(
              "w-full max-w-md transition-all duration-500 ease-in-out",
              isRightView
                ? "opacity-100"
                : "opacity-20 pointer-events-none blur-sm",
            )}
          >
            {mode === "receipt" ? (
              <RequestReceiptForm
                username={signedUpUsername}
                onBack={() => setMode("login")}
              />
            ) : (
              <SignupForm
                onToggle={() => setMode("login")}
                onToggleReceipt={(username) => {
                  setSignedUpUsername(username)
                  setMode("receipt")
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-0 h-full w-1/2 hidden lg:block transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-50 p-5",
          isLeftView ? "translate-x-full" : "translate-x-0",
        )}
      >
        <div className="relative h-full w-full overflow-hidden shadow-2xl rounded-xl flex flex-col items-center">
          <img
            src={isLeftView ? "/tektite_1.jpg" : "/tektite_2.jpg"}
            alt="MIS Background"
            className="absolute inset-0 h-full w-full object-cover animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3c51c7]/100 via-[#3c51c7]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/30 to-transparent" />

          <div
            key={mode}
            className="relative z-10 flex h-full w-full flex-col items-center justify-between py-[10vh] px-6 md:px-12 text-center text-white animate-in fade-in slide-in-from-bottom-8 duration-700"
          >
            <div className="flex flex-col items-center space-y-0 md:space-y-1">
              <h2 className="text-2xl xs:text-xl sm:text-2xl md:text-3xl lg:text-3xl font-semibold tracking-tight font-poppins leading-tight">
                {isLeftView
                  ? "One Portal. Every Tool. Unified."
                  : "We Link the World."}
              </h2>
              <p className="text-sm xs:text-xs sm:text-base md:text-lg font-medium text-white max-w-md lg:max-w-xl leading-relaxed">
                {isLeftView
                  ? "Log in to access and manage your tools and account"
                  : "Eurolink Network International Corporation"}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center w-full max-w-[85%] lg:max-w-[95%] my-8">
              <img
                src={isLeftView ? "/ui-preview-1.svg" : "/ui-preview-2.svg"}
                alt="System Graphic"
                className="w-full h-auto max-h-[40vh] md:max-h-[50vh] object-contain animate-pulse-slow"
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="h-6 sm:h-8 md:h-12 w-auto flex items-center justify-center">
                <img
                  src="/enic-internal-system.svg"
                  alt="ENIC-MIS Logo"
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="flex flex-col items-center space-y-1">
                <p className="text-[10px] sm:text-[12px] font-medium text-white/60">
                  2026 All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}