import { useAuth } from "@/auth-context";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notifToast } from "@/lib/notifToast";
import NProgress from "@/lib/nprogress";
import { authenticationApi } from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z
    .string()
    .transform((pwd) => pwd.trim())
    .refine((pwd) => pwd.length > 0, { message: "Password is required." }),
});

type UserForm = z.infer<typeof formSchema>;

export function LoginForm({
  onToggleSignup,
  onToggleForgot,
}: {
  onToggleSignup: () => void;
  onToggleForgot: () => void;
}) {
  const { refreshUser } = useAuth()
  const navigate = useNavigate();

  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)

  const form = useForm<UserForm>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: UserForm) => {
    setBlockedMessage(null)
    setRequestStatus(null)
    try {
      NProgress.start()
      const response = await authenticationApi.login(data)
      if (!response.success) {
        if (response.requestStatus === 'Rejected') {
          setBlockedMessage(response.message)
          setRequestStatus('Rejected')
        } else if (response.requestStatus === 'Pending') {
          setBlockedMessage(response.message)
          setRequestStatus('Pending')
        } else {
          notifToast({ reason: response.message }, 'error')
        }
        return
      }
      await refreshUser()
      navigate('/home')
    } catch (error) {
      const res = (error as { response?: { data?: { errors?: Record<string, string>; message?: string } } })?.response?.data
      if (res?.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          form.setError(key as keyof UserForm, { type: 'server', message: value })
        })
      }
      notifToast({ reason: res?.message ?? 'Something went wrong' }, 'error')
    } finally {
      NProgress.done()
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Login to your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials below
        </p>
      </div>

      {requestStatus === 'Rejected' && (
        <Alert variant="destructive" className="text-start">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Registration Rejected</AlertTitle>
          <AlertDescription>{blockedMessage}</AlertDescription>
        </Alert>
      )}

      {requestStatus === 'Pending' && (
        <Alert className="text-start border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <AlertTitle>Pending Approval</AlertTitle>
          <AlertDescription>{blockedMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="eg. j.luna" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <p className="w-full justify-between flex items-center">
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    onClick={onToggleForgot}
                    className="underline underline-offset-4 text-sm"
                  >
                    Forgot password?
                  </button>
                </p>
                <FormControl>
                  <PasswordInput
                    placeholder="e.g., S3cur3P@ssw0rd"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full disabled:opacity-100 !mt-10"
          >
            Login
          </Button>

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
        </form>
      </Form>
    </div>
  );
}
