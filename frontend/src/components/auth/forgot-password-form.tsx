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
import { forgotPasswordSchema, type ForgotPasswordRequest } from "@/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authenticationApi } from "@/services/auth";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isSent, setIsSent] = useState(false);
  // Initialize the form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // State to hold any server-side error messages
  const [serverError, setServerError] = useState<string | null>(null);

  // Function to handle form submission
  const onSubmit = async (data: ForgotPasswordRequest) => {
    try {
      setServerError(null);
      const response = await authenticationApi.forgotPassword(data);
      setIsSent(true);
      if (!response.success) {
        setServerError(response.message);
        return;
      }
    } catch (error: any) {
      const res = error.response?.data;

      if (!res) {
        setServerError("Something went wrong");
        return;
      }
      // Handle field-level errors
      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          setError(key as keyof ForgotPasswordRequest, {
            type: "server",
            message: value as string,
          });
        });
      }
      // Handle general message
      if (res.message) {
        setServerError(res.message);
      }
    }
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>System Username</FieldLabel>
              <Input
                // Spread the register function to connect the input with react-hook-form
                {...register("username")}
                type="text"
                placeholder="eg. j.luna"
              />
              <FieldDescription>
                Enter the username associated with your MIS account.
              </FieldDescription>
              <p className="text-sm text-red-500">
                {/* Display validation error for the username field, if any*/}
                {errors.username?.message}
              </p>
            </Field>
            <p className="text-red-500 text-sm">{
              // Display any server-side error messages that are not field-specific
              serverError
            }</p>
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
