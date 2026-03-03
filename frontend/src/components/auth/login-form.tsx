import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/services/auth";
import { useAuth } from "@/auth-context";
import { useNavigate } from "react-router-dom";
import { loginSchema } from "@/validations";
import type { LoginRequest } from "@/validations";

export function LoginForm({
  onToggleSignup,
  onToggleForgot,
}: {
  onToggleSignup: () => void;
  onToggleForgot: () => void;
}) {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: LoginRequest) => {
    try {
      setServerError(null);
      const response = await login(data);
      await refreshUser();
      navigate("/home");
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
          setError(key as keyof LoginRequest, {
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
    <form
      className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      onSubmit={handleSubmit(onSubmit)}
    >
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
          <Input
            {...register("username")}
            type="text"
            placeholder="eg. j.luna"
          />
          <p className="text-red-500 text-sm">{errors.username?.message}</p>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>Password</FieldLabel>
            <button
              type="button"
              onClick={onToggleForgot}
              className="text-xs underline underline-offset-4 hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <Input {...register("password")} type="password" />
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
        </Field>
        <p className="text-red-500 text-sm">{serverError}</p>
        <Button type="submit" className="w-full">
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
      </FieldGroup>
    </form>
  );
}
