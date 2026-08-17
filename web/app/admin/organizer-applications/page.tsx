"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IdCard } from "lucide-react";
import {
  useAdminOrganizerApplications,
  useResolveOrganizerApplication,
  organizerApplicationDocumentUrl,
} from "@/lib/hooks/useOrganizerApplications";
import { apiClient, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { OrganizerApplication, OrganizerApplicationStatus } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

const STATUS_BADGE: Record<OrganizerApplicationStatus, "secondary" | "default" | "destructive"> = {
  PENDING: "default",
  APPROVED: "secondary",
  REJECTED: "destructive",
};

function ApplicationDetailSheet({ application }: { application: OrganizerApplication }) {
  const [open, setOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const resolve = useResolveOrganizerApplication();

  const handleResolve = (status: OrganizerApplicationStatus) => {
    resolve.mutate(
      { applicationId: application.id, status, rejectionReason: rejectionReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(status === "APPROVED" ? "Application approved." : "Application rejected.");
          setOpen(false);
          setRejectionReason("");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update application."),
      },
    );
  };

  const handleViewDocument = () => {
    apiClient
      .download(organizerApplicationDocumentUrl(application.id), `id-document-${application.applicantUsername ?? application.id}`)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to download document."));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" />}>Review</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Organizer application</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Applicant</p>
              <p>{application.applicantName ?? "—"} (@{application.applicantUsername ?? "—"})</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Legal name</p>
              <p>{application.legalName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ID document</p>
              <p>
                {application.idDocumentType} — {application.idDocumentNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organization</p>
              <p>{application.organizationName || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Address</p>
              <p>{application.address}</p>
            </div>
            {application.reason && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Reason for applying</p>
                <p>{application.reason}</p>
              </div>
            )}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={handleViewDocument}>
            Download ID document
          </Button>

          {application.status === "PENDING" && (
            <div className="space-y-1.5 pt-2">
              <Label>Rejection reason (if rejecting)</Label>
              <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
            </div>
          )}
        </SheetBody>
        {application.status === "PENDING" && (
          <SheetFooter className="flex gap-2">
            <Button variant="destructive" disabled={resolve.isPending} onClick={() => handleResolve("REJECTED")}>
              Reject
            </Button>
            <Button disabled={resolve.isPending} onClick={() => handleResolve("APPROVED")}>
              Approve
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function AdminOrganizerApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<OrganizerApplicationStatus | "ALL">("PENDING");
  const { data: applications, isLoading } = useAdminOrganizerApplications(
    statusFilter === "ALL" ? undefined : statusFilter,
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Organizer Applications" }]} />

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Organizer Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v as OrganizerApplicationStatus | "ALL")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : !applications || applications.length === 0 ? (
            <EmptyState icon={IdCard} title="No applications" description="Nothing here for this filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Legal name</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.applicantName ?? "—"}
                      <span className="ml-1 text-xs text-muted-foreground">@{a.applicantUsername ?? "—"}</span>
                    </TableCell>
                    <TableCell>{a.legalName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ApplicationDetailSheet application={a} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
