import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "@/services/auth";
import { registerSchema } from "@/validations";
import type { SignupRequest } from "@/validations";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/password-input";

export default function SignupForm({ onToggle }: { onToggle: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<SignupRequest>({
    mode: "onChange",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullname: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const fullname = form.watch("fullname");
  const username = form.watch("username");

  useEffect(() => {
    if (!fullname?.trim()) {
      form.setValue("username", "");
      return;
    }

    const names = fullname.toLowerCase().trim().split(/\s+/);
    const generated =
      names.length >= 2
        ? `${names[0].charAt(0)}.${names[names.length - 1]}`
        : names[0];

    form.setValue("username", generated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [fullname, form]);

  const copyUsername = async () => {
    if (!username) return;
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  const onSubmit = async (data: SignupRequest) => {
    try {
      setServerError(null);
      const response = await signup(data);
      if (!response.success) {
        setServerError(response.message);
        return;
      }
      onToggle();
    } catch (error: any) {
      const res = error.response?.data;

      if (!res) {
        setServerError("Something went wrong");
        return;
      }

      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          form.setError(key as keyof SignupRequest, {
            type: "server",
            message: value as string,
          });
        });
      }

      if (res.message) {
        setServerError(res.message);
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Request Access</h1>
        <p className="text-muted-foreground text-sm">
          Create local system credentials
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="eg. Juan Luna" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      className="font-mono text-primary pr-10 cursor-default bg-muted/50"
                      // readOnly
                      {...field}
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
                </FormControl>
                <FormDescription>
                  Generated identifier for ENIC - MIS.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm</FormLabel>
                  <FormControl>
                    <PasswordInput
                      disabled={!form.formState.dirtyFields.password}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            Submit Request
          </Button>

          <p className="text-center text-sm">
            Returning?{" "}
            <Button
              type="button"
              onClick={onToggle}
              className="font-semibold underline underline-offset-4 hover:text-primary p-0"
              variant="link"
            >
              Sign In
            </Button>
          </p>
        </form>
      </Form>
    </div>
  );
}