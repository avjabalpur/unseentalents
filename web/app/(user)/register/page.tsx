"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { TermsDialog } from "@/components/shared/TermsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Brand } from "@/components/shared/Brand";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "At most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must include at least one letter")
    .regex(/[0-9]/, "Must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Must include at least one symbol"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms and Conditions to continue",
  }),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { agreeToTerms: false } });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      await registerUser(values.name, values.username, values.email, values.password);
      router.push("/");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(var(--brand-rgb),0.18), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(var(--brand-rgb),0.12), transparent)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card/70 p-8 shadow-2xl backdrop-blur sm:p-10">
        <Link href="/" className="mb-8 flex justify-center">
          <Brand className="text-3xl" />
        </Link>

        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Join the stage
        </p>
        <h1 className="text-center text-2xl font-bold text-white sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-center text-base text-muted-foreground">
          Sign up to get free welcome credits and enter a competition.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              Name
            </Label>
            <Input id="name" inputSize="lg" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-base">
              Username
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input id="username" inputSize="lg" className="pl-8" {...register("username")} />
            </div>
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Email
            </Label>
            <Input id="email" type="email" inputSize="lg" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <Input id="password" type="password" inputSize="lg" {...register("password")} />
            <p className="text-xs text-muted-foreground">
              Create your password using 8 characters or more. It must be any combination of at least one
              letters, numbers, and symbols.
            </p>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <Controller
            name="agreeToTerms"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setTermsOpen(true)}
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Terms and Conditions
                    </button>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
                )}
              </div>
            )}
          />

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-6 text-center text-base text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>

      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
