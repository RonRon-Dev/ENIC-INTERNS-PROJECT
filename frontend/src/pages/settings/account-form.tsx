import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { PasswordInput } from "@/components/password-input";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { Copy, Check } from "lucide-react";
import { updateAccountSchema, type UpdateAccountRequest } from "@/validations";
import { useAuth } from "@/auth-context";
import NProgress from "@/lib/nprogress";
import { settingsApi } from "@/services/settings";

export function AccountForm() {
  const [copied, setCopied] = useState(false); // ✅ moved to component level
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

  const password = form.watch("password");

  const onSubmit = async (data: UpdateAccountRequest) => {
    try {
      NProgress.start();
      setServerError(null);
      const response = await settingsApi.updateAccount(data);
      if (!response.success) {
        setServerError(response.message);
        NProgress.done();
        return;
      }
    } catch (error: any) {
      const res = error.response?.data;

      if (!res) {
        setServerError("Something went wrong");
        return;
      }

      if (res.errors) {
        Object.entries(res.errors).forEach(([key, value]) => {
          form.setError(key as keyof UpdateAccountRequest, {
            type: "server",
            message: value as string,
          });
        });
      }

      if (res.message) {
        setServerError(res.message);
      }
    }

    NProgress.done();
  }

  const copyUsername = () => {
    const username = form.getValues("username");
    if (!username) return;
    navigator.clipboard.writeText(username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                  <PasswordInput disabled={!password} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={!form.formState.isDirty} type="submit">
          Update account
        </Button>
      </form>
    </Form>
  );
}
