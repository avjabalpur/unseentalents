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
import { Badge } from "@/components/ui/badge";

export default function AccountProfilePage() {
  const { user, refetchUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");

  if (!user) return null;

  const handleSave = () => {
    updateProfile.mutate(
      { name: name.trim() },
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
    <div className="space-y-6">
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
          <Button onClick={handleSave} disabled={updateProfile.isPending || !name.trim() || name.trim() === user.name}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Used to upload new entries — earn more via coupons.</p>
          <Badge className="px-3 py-1.5 text-base">{user.creditBalance} credits</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
