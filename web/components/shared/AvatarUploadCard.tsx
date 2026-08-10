"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useUploadAvatar } from "@/lib/hooks/useAccount";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AvatarUploadCard() {
  const { user, refetchUser } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  if (!user) return null;

  const handleFile = (file: File | null) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file, {
      onSuccess: async () => {
        await refetchUser();
        toast.success("Avatar updated.");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to upload avatar."),
    });
  };

  const avatarUrl = preview ?? mediaUrl(user.avatarKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xl font-semibold text-muted-foreground">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            user.name[0]?.toUpperCase() ?? "?"
          )}
        </span>
        <div className="space-y-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadAvatar.isPending}
          >
            {uploadAvatar.isPending ? "Uploading…" : "Change avatar"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG or PNG. Square images look best.</p>
        </div>
      </CardContent>
    </Card>
  );
}
