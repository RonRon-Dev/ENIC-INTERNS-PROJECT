import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { notifToast } from "@/lib/notifToast";
import NProgress from "@/lib/nprogress";
import { authenticationApi } from "@/services/auth";
import type { SignupRequest } from "@/validations";
import { registerSchema } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Minus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function SignupForm({
  onToggle,
  onToggleReceipt
}: {
  onToggle: () => void;
  onToggleReceipt: (username: string) => void
}) {

  const form = useForm<SignupRequest>({
    mode: "onChange",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullname: "".toLowerCase().trim(),
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const fullname = form.watch("fullname");

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

  const onSubmit = async (data: SignupRequest) => {
    try {
      NProgress.start()
      const response = await authenticationApi.signup(data)
      if (!response.success) {
        notifToast({ reason: response.message }, 'error')
        return
      }
      onToggleReceipt(data.username)
    } catch (error) {
      const res = (error as { response?: { data?: { errors?: Record<string, string>; message?: string } } })?.response?.data
      if (!res) {
        notifToast({ reason: 'Something went wrong' }, 'error')
        return
      }
      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          form.setError(key as keyof SignupRequest, { type: 'server', message: value })
        })
      }
      notifToast({ reason: res.message ?? 'Something went wrong' }, 'error')
    } finally {
      NProgress.done()
    }
  }

  const passwordRules = [
    { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
    { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  ]

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
                  <Input
                    className="font-mono text-primary pr-10 cursor-default bg-muted/50"
                    // readOnly
                    {...field}
                    onChange={(e) => {
                      let value = e.target.value
                      value = value.replace(/\s/g, '').toLowerCase()
                      field.onChange(value)
                    }}
                  />
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
                  {form.formState.dirtyFields.password && (
                    <div className="mt-2 space-y-1">
                      {passwordRules.map(({ label, test }) => {
                        const passed = test(field.value ?? '')
                        return (
                          <div key={label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-success' : 'text-muted-foreground'}`}>
                            {passed
                              ? <Check className="size-3 shrink-0" />
                              : <Minus className="size-3 shrink-0" />
                            }
                            {label}
                          </div>
                        )
                      })}
                    </div>
                  )}
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

          {/* {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )} */}

          <Button
            type="submit"
            className="w-full disabled:opacity-100 !mt-10"
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
