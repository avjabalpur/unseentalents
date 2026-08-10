"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile } from "@/lib/hooks/useAccount";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileDetailsCard() {
  const { user, refetchUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? "");
  const [facebookUrl, setFacebookUrl] = useState(user?.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(user?.instagramUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(user?.twitterUrl ?? "");

  if (!user) return null;

  const isDirty =
    name.trim() !== user.name ||
    facebookUrl.trim() !== (user.facebookUrl ?? "") ||
    instagramUrl.trim() !== (user.instagramUrl ?? "") ||
    twitterUrl.trim() !== (user.twitterUrl ?? "");

  const handleSave = () => {
    updateProfile.mutate(
      {
        name: name.trim(),
        facebookUrl: facebookUrl.trim() || null,
        instagramUrl: instagramUrl.trim() || null,
        twitterUrl: twitterUrl.trim() || null,
      },
      {
        onSuccess: async () => {
          await refetchUser();
          toast.success("Profile updated.");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update profile."),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={`@${user.username}`} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Member since</Label>
            <Input value={formatDate(user.createdAt)} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Facebook</Label>
            <Input
              placeholder="https://facebook.com/…"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input
              placeholder="https://instagram.com/…"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>X (Twitter)</Label>
            <Input placeholder="https://x.com/…" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateProfile.isPending || !name.trim() || !isDirty}>
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
