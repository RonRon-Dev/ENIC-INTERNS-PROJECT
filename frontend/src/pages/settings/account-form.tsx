import { useAuth } from "@/auth-context";
import { PasswordInput } from '@/components/password-input';
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
import { notifToast } from '@/lib/notifToast';
import NProgress from "@/lib/nprogress";
import { settingsApi } from "@/services/settings";
import { updateAccountSchema, type UpdateAccountRequest } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export function AccountForm() {
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { user } = useAuth();

  const form = useForm<UpdateAccountRequest>({
    mode: "onChange",
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      fullname: user?.name || "",
      username: user?.userName || "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordRules = [
    { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
    { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
    { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  ]


  const password = form.watch('password')
  const fullname = form.watch('fullname')

  useEffect(() => {
    if (!fullname?.trim()) return
    const names = fullname.toLowerCase().trim().split(/\s+/)
    const generated = names.length >= 2
      ? `${names[0].charAt(0)}.${names[names.length - 1]}`
      : names[0]

    const current = form.getValues('username')
    if (current === generated) return  // ← skip if unchanged

    form.setValue('username', generated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [fullname, form])

  useEffect(() => {
    if (!user) return
    form.reset({
      fullname: user.name || '',
      username: user.userName || '',
      password: '',
      confirmPassword: '',
    })
  }, [user])

  const onSubmit = async (data: UpdateAccountRequest) => {
    try {
      NProgress.start()
      setServerError(null)
      const response = await settingsApi.updateAccount(data)
      if (!response.success) {
        setServerError(response.message)
        return
      }
      notifToast({ name: data.username, role: undefined, reason: response.message }, 'edit')
      form.reset({ ...data, password: '', confirmPassword: '' })
    } catch (error) {
      const res = (error as { response?: { data?: { errors?: Record<string, string>; message?: string } } })?.response?.data
      if (!res) { setServerError('Something went wrong'); return }
      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          form.setError(key as keyof UpdateAccountRequest, {
            type: 'server',
            message: value,
          })
        })
      }
      notifToast({ name: data.username, role: undefined, reason: res?.message }, "error");
      if (res.message) setServerError(res.message)
    } finally {
      NProgress.done()
    }
  }

  const copyUsername = () => {
    const username = form.getValues('username')
    if (!username) return
    navigator.clipboard.writeText(username)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Full Name */}
        <FormField
          control={form.control}
          name="fullname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="eg. Juan Luna" {...field} />
              </FormControl>
              <FormDescription>
                Your real name as it appears in the system.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Username</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    className="font-mono text-primary bg-muted/50 pr-8"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\s/g, "")
                        .toLowerCase();
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={copyUsername}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <FormDescription>
                Generated identifier for ENIC - MIS. Used to log in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Leave blank to keep current"
                    {...field}
                  />
                </FormControl>
                {password && (
                  <div className="pt-2 space-y-1">
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
                  <PasswordInput disabled={!password} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* {serverError && (
          <Alert variant='destructive'>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )} */}
        <Button
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? 'Updating...' : 'Update account'}
        </Button>
      </form>
    </Form>
  );
}
