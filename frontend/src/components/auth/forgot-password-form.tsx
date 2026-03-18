import { useState } from "react";
import { ChevronLeft, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { notifToast } from "@/lib/notifToast";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [isSent, setIsSent] = useState(false);
  const [resetRequestStatus, setResetRequestStatus] = useState<{ status: string; reason: string | null } | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordRequest) => {
    try {
      const response = await authenticationApi.forgotPassword(data);
      if (!response.success) {
        notifToast({ reason: response.message }, 'error');
        return;
      }
      setIsSent(true);
      // After a successful submission, check the current status of the latest reset request
      // (it could be newly Pending, or the previous one was Rejected giving them a reason to resubmit)
      try {
        const status = await authenticationApi.getMyRequestStatus('Reset Password');
        if (status) {
          setResetRequestStatus({ status: status.requestStatus, reason: status.decisionReason });
        }
      } catch { /* not authenticated — ignore */ }
    } catch (error: any) {
      const res = error.response?.data;

      if (!res) {
        notifToast({ reason: 'Something went wrong' }, 'error');
        return;
      }
      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          setError(key as keyof ForgotPasswordRequest, {
            type: "server",
            message: value as string,
          });
        });
      }
      if (res.message) {
        notifToast({ reason: res.message }, 'error');
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
          {resetRequestStatus?.status === 'Rejected' && resetRequestStatus.reason && (
            <Alert variant="destructive" className="text-start mt-2">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Previous Request Rejected</AlertTitle>
              <AlertDescription>
                Reason: <span className="font-semibold">{resetRequestStatus.reason}</span>. Your new request has been submitted.
              </AlertDescription>
            </Alert>
          )}
          {!resetRequestStatus && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              New request submitted successfully.
            </div>
          )}
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
