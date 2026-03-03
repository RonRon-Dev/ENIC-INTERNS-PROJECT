import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "@/services/auth";
import { registerSchema } from "@/validations";
import type { SignupRequest } from "@/validations";

export default function SignupForm({ onToggle }: { onToggle: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupRequest>({
    resolver: zodResolver(registerSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const onSubmit = async (data: SignupRequest) => {
    try {
      setServerError(null);
      const response = await signup(data);
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
          setError(key as keyof SignupRequest, {
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
    onToggle();
  };

  const fullname = watch("fullname");
  const username = watch("username");

  useEffect(() => {
    if (!fullname) {
      setValue("username", "");
      return;
    }

    const names = fullname.toLowerCase().trim().split(/\s+/);

    const username =
      names.length >= 2
        ? `${names[0].charAt(0)}.${names[names.length - 1]}`
        : names[0];

    setValue("username", username, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [fullname, setValue]);

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

  return (
    <form
      className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
      onSubmit={handleSubmit(onSubmit)}
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
            {...register("fullname")}
            placeholder="eg. Juan Luna"
            type="text"
          />
          <p className="text-sm text-red-500">
            {errors.fullname?.message}
          </p>
        </Field>
        <Field>
          <FieldLabel>System Username</FieldLabel>
          <div className="relative">
            <Input
              {...register("username")}
              className="font-mono text-primary pr-10 cursor-default"
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
          <p className="text-sm text-red-500">
            {errors.username?.message}
          </p>
          <FieldDescription>
            Generated identifier for ENIC - MIS.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input {...register("password")} type="password" />
          </Field>
          <Field>
            <FieldLabel>Confirm</FieldLabel>
            <Input {...register("confirmPassword")} type="password" />
          </Field>
          <p className="text-sm text-red-500 col-span-2">
            {errors.password?.message || errors.confirmPassword?.message}
          </p>
        </div>
        <p className="text-red-500 text-sm">{serverError}</p>
        <Button 
          type="submit"
          className="w-full mt-2">
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
      </FieldGroup>
    </form>
  );
}
