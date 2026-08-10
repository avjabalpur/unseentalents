"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarUploadCard } from "@/components/shared/AvatarUploadCard";
import { ProfileDetailsCard } from "@/components/shared/ProfileDetailsCard";

export default function AccountProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <AvatarUploadCard />
      <ProfileDetailsCard />

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
