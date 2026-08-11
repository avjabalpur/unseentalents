"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useSubmitContactMessage } from "@/lib/hooks/useContact";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Please add a few more details"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const submitMessage = useSubmitContactMessage();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await submitMessage.mutateAsync(values);
      setSent(true);
      reset();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong — please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Get in touch</p>
        <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">Contact Us</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Questions, feedback, or an issue with your entry? Send us a message and we&apos;ll follow up by
          email.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            Send a message
          </CardTitle>
          <CardDescription>
            This currently reaches our team directly — automated email replies are coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-center">
              <p className="font-medium text-white">Thanks — we&apos;ve received your message.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll get back to you at the email address you provided.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" {...register("subject")} />
                {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={5} {...register("message")} />
                {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
