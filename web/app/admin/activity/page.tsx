"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { useAdminActivity } from "@/lib/hooks/useActivity";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

const ENTITY_TYPES = ["SUBMISSION", "USER", "COUPON", "EVENT_TYPE"];

export default function AdminActivityPage() {
  const [entityType, setEntityType] = useState<string>("ALL");
  const { data: logs, isLoading } = useAdminActivity(entityType === "ALL" ? {} : { entityType });

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Activity" }]} />

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={entityType} onValueChange={(v) => v && setEntityType(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All entities</SelectItem>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : !logs || logs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity" description="Nothing logged for this filter yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.entityType}</Badge>
                    </TableCell>
                    <TableCell>{log.actorName ?? "System"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {log.logMetadata ? JSON.stringify(log.logMetadata) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" title={formatDate(log.createdAt)}>
                      {formatRelativeTime(log.createdAt)}
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
