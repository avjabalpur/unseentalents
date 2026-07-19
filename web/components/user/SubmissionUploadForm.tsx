"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useUploadSubmission } from "@/lib/hooks/useSubmissions";
import { ApiError } from "@/lib/api-client";
import type { MediaType } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubmissionUploadFormProps {
  stageId: string;
  mediaType: MediaType;
  onUploaded?: () => void;
}

export function SubmissionUploadForm({ stageId, mediaType, onUploaded }: SubmissionUploadFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const upload = useUploadSubmission(stageId);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const accept = mediaType === "VIDEO" ? "video/*" : "image/*";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!file) {
      toast.error(`Choose a ${mediaType.toLowerCase()} file first.`);
      return;
    }
    upload.mutate(
      { file, title: title.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Uploaded! Your entry is awaiting moderation before it's public.");
          setFile(null);
          setTitle("");
          setNotes("");
          onUploaded?.();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Upload failed."),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit your entry</CardTitle>
        <CardDescription>One {mediaType.toLowerCase()} per competition — uses 1 credit.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{mediaType === "VIDEO" ? "Video" : "Image"} file</Label>
            <Input type="file" accept={accept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes about your entry (optional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell voters a bit about your performance…"
            />
          </div>
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
