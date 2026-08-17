"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSubmitOrganizerApplication } from "@/lib/hooks/useOrganizerApplications";
import { ApiError } from "@/lib/api-client";
import { TermsDialog } from "@/components/shared/TermsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ID_DOCUMENT_TYPES = ["Passport", "National ID / Aadhar", "Driver's License", "Other government ID"];

const accountSchema = z.object({
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

const applicationSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  address: z.string().min(1, "Address is required"),
  idDocumentType: z.string().min(1, "Select a document type"),
  idDocumentNumber: z.string().min(1, "ID document number is required"),
  organizationName: z.string().optional(),
  reason: z.string().optional(),
});

const schema = accountSchema.merge(applicationSchema);
type FormValues = z.infer<typeof schema>;

const ACCOUNT_FIELDS = ["name", "username", "email", "password", "agreeToTerms"] as const;

const STEPS = [
  { step: 1, label: "Account" },
  { step: 2, label: "Organizer details" },
] as const;

export function OrganizerRegisterWizard() {
  const { register: registerUser } = useAuth();
  const submitApplication = useSubmitOrganizerApplication();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      agreeToTerms: false,
      legalName: "",
      address: "",
      idDocumentType: "",
      idDocumentNumber: "",
      organizationName: "",
      reason: "",
    },
  });

  const handleContinue = async () => {
    const valid = await trigger(ACCOUNT_FIELDS);
    if (valid) setStep(2);
  };

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    if (!file) {
      setFormError("Please upload a government ID document.");
      return;
    }

    try {
      await registerUser(values.name, values.username, values.email, values.password);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong creating your account.");
      return;
    }

    submitApplication.mutate(
      {
        legalName: values.legalName,
        address: values.address,
        idDocumentType: values.idDocumentType,
        idDocumentNumber: values.idDocumentNumber,
        organizationName: values.organizationName || undefined,
        reason: values.reason || undefined,
        file,
      },
      {
        onSuccess: () => {
          toast.success("Account created and application submitted — an admin will review it soon.");
          router.push("/account/organizer");
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Your account was created, but we couldn't submit your organizer application.",
          );
          router.push("/account/organizer");
        },
      },
    );
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(var(--brand-rgb),0.18), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(var(--brand-rgb),0.12), transparent)",
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card/70 p-8 shadow-2xl backdrop-blur sm:p-10">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Register as organizer
        </p>
        <h1 className="font-heading text-center text-2xl font-bold text-white sm:text-3xl">
          Run your own event
        </h1>
        <p className="mt-2 text-center text-base text-muted-foreground">
          Since real prizes and credits are involved, every organizer application is reviewed by an admin.
        </p>

        <ol className="mt-8 flex items-center justify-center gap-3">
          {STEPS.map(({ step: s, label }, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-white/10 text-muted-foreground",
                )}
              >
                {step > s ? <Check className="size-4" /> : s}
              </span>
              <span className={cn("text-sm", step === s ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px w-8 bg-white/10" />}
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          {step === 1 && (
            <>
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
                    {errors.agreeToTerms && <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>}
                  </div>
                )}
              />

              <Button type="button" size="xl" className="w-full" onClick={handleContinue}>
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Legal name</Label>
                <Input inputSize="lg" placeholder="As on your ID" {...register("legalName")} />
                {errors.legalName && <p className="text-sm text-destructive">{errors.legalName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-base">Organization name (optional)</Label>
                <Input inputSize="lg" {...register("organizationName")} />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Address</Label>
                <Textarea rows={2} {...register("address")} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-base">ID document type</Label>
                <Controller
                  name="idDocumentType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.idDocumentType && <p className="text-sm text-destructive">{errors.idDocumentType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-base">ID document number</Label>
                <Input inputSize="lg" {...register("idDocumentNumber")} />
                {errors.idDocumentNumber && (
                  <p className="text-sm text-destructive">{errors.idDocumentNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-base">Why do you want to organize events? (optional)</Label>
                <Textarea rows={3} {...register("reason")} />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Upload your ID document</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    {file ? "Change file" : "Choose file"}
                  </Button>
                  <span className="text-sm text-muted-foreground">{file ? file.name : "No file selected"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only reviewed by admins for identity verification — never shown publicly.
                </p>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="xl" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" size="xl" className="flex-1" disabled={isSubmitting || submitApplication.isPending}>
                  {isSubmitting || submitApplication.isPending ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>

      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
