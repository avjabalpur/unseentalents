"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { useAdminReports, useModerateSubmission, useResolveReport } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Report, ReportStatus } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

const STATUS_BADGE: Record<ReportStatus, "secondary" | "default" | "destructive"> = {
  PENDING: "default",
  REVIEWED: "secondary",
  DISMISSED: "destructive",
};

function RevokeApprovalSheet({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const moderate = useModerateSubmission();
  const resolveReport = useResolveReport();

  const handleRevoke = () => {
    moderate.mutate(
      { submissionId: report.targetId, approve: false, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          resolveReport.mutate({ reportId: report.id, status: "REVIEWED" });
          toast.success("Approval revoked — entry rejected.");
          setOpen(false);
          setReason("");
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to revoke approval."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="destructive" />}>Revoke approval</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Revoke approval</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-1.5">
          <Label>Reason (shown to the uploader)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        </SheetBody>
        <SheetFooter>
          <Button variant="destructive" onClick={handleRevoke} disabled={moderate.isPending}>
            {moderate.isPending ? "Revoking…" : "Revoke and reject entry"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("PENDING");
  const { data: reports, isLoading } = useAdminReports(statusFilter === "ALL" ? undefined : statusFilter);
  const resolveReport = useResolveReport();

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Reports" }]} />

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as ReportStatus | "ALL")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : !reports || reports.length === 0 ? (
            <EmptyState icon={Flag} title="No reports" description="Nothing here for this filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reported by</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.targetType === "SUBMISSION" ? (
                        <Link
                          href={`/submissions/${r.targetId}`}
                          target="_blank"
                          className="text-primary underline underline-offset-4"
                        >
                          Submission
                        </Link>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="font-medium">{r.reason}</p>
                      {r.notes && <p className="mt-0.5 text-xs text-muted-foreground">{r.notes}</p>}
                    </TableCell>
                    <TableCell>{r.reporterName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {r.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resolveReport.isPending}
                            onClick={() =>
                              resolveReport.mutate(
                                { reportId: r.id, status: "REVIEWED" },
                                {
                                  onSuccess: () => toast.success("Marked as reviewed."),
                                  onError: (err) =>
                                    toast.error(err instanceof ApiError ? err.message : "Failed to update report."),
                                },
                              )
                            }
                          >
                            Mark reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resolveReport.isPending}
                            onClick={() =>
                              resolveReport.mutate(
                                { reportId: r.id, status: "DISMISSED" },
                                {
                                  onSuccess: () => toast.success("Report dismissed."),
                                  onError: (err) =>
                                    toast.error(err instanceof ApiError ? err.message : "Failed to update report."),
                                },
                              )
                            }
                          >
                            Dismiss
                          </Button>
                          {r.targetType === "SUBMISSION" && <RevokeApprovalSheet report={r} />}
                        </>
                      )}
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
