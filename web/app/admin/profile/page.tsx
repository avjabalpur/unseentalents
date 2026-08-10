"use client";

import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { AvatarUploadCard } from "@/components/shared/AvatarUploadCard";
import { ProfileDetailsCard } from "@/components/shared/ProfileDetailsCard";
import { ChangePasswordCard } from "@/components/shared/ChangePasswordCard";

export default function AdminProfilePage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Profile" }]} />
      <AvatarUploadCard />
      <ProfileDetailsCard />
      <ChangePasswordCard />
    </div>
  );
}
