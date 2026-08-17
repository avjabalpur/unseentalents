"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useMyOrganizerApplication } from "@/lib/hooks/useOrganizerApplications";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizerApplicationForm } from "@/components/shared/OrganizerApplicationForm";

export default function AccountOrganizerPage() {
  const { user } = useAuth();
  const { data: application, isLoading, refetch } = useMyOrganizerApplication();

  if (!user) return null;

  if (user.role === "ORGANIZER" || user.role === "ADMIN" || user.role === "MODERATOR") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizer access</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="size-5 shrink-0 text-primary" />
          Your account already has organizer access.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (application?.status === "PENDING") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizer application</CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
          <Clock className="size-5 shrink-0 text-primary" />
          <div>
            <p>Your application is under review.</p>
            <p className="mt-1 text-xs">Submitted {formatDate(application.createdAt)}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {application?.status === "REJECTED" && (
        <Card>
          <CardHeader>
            <CardTitle>Previous application rejected</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
            <XCircle className="size-5 shrink-0 text-destructive" />
            <div>
              <p>{application.rejectionReason || "No reason was given."}</p>
              <p className="mt-1 text-xs">You can submit a new application below.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <OrganizerApplicationForm onSubmitted={() => refetch()} />
    </div>
  );
}
