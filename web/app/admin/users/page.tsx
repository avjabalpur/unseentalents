"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useAdminUsers,
  useBulkUpdateUserStatus,
  useGrantCredit,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import type { UserRole } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/admin/EmptyState";
import { UserDetailSheet } from "@/components/admin/UserDetailSheet";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { UserSearch } from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const grantCredit = useGrantCredit();
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const bulkUpdateStatus = useBulkUpdateUserStatus();
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const filteredUsers = (users ?? []).filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const selectableIds = filteredUsers.filter((u) => u.id !== currentUser?.id).map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulkStatus = (nextStatus: "ACTIVE" | "SUSPENDED") => {
    bulkUpdateStatus.mutate(
      { userIds: [...selected], status: nextStatus },
      {
        onSuccess: () => {
          toast.success(nextStatus === "SUSPENDED" ? "Blocked selected users." : "Unblocked selected users.");
          setSelected(new Set());
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Bulk update failed."),
      },
    );
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Users" }]} />
      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Search by name, username, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v as UserRole | "ALL")}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <ExportCsvButton path="/admin/export/users" filename="users.csv" label="Export users" />
              <ExportCsvButton path="/admin/export/credits" filename="credit_transactions.csv" label="Export credits" />
            </div>
          </div>

          {selected.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-accent/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="destructive" disabled={bulkUpdateStatus.isPending} onClick={() => runBulkStatus("SUSPENDED")}>
                Block selected
              </Button>
              <Button size="sm" variant="outline" disabled={bulkUpdateStatus.isPending} onClick={() => runBulkStatus("ACTIVE")}>
                Unblock selected
              </Button>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton columns={9} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={UserSearch} title="No users found" description="Try adjusting your search or role filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all users" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Grant credits</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      {u.id !== currentUser?.id && (
                        <Checkbox
                          checked={selected.has(u.id)}
                          onCheckedChange={() => toggleOne(u.id)}
                          aria-label={`Select ${u.name}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        disabled={updateRole.isPending || u.id === currentUser?.id}
                        onValueChange={(v) => {
                          if (!v || v === u.role) return;
                          const roleLabel = v === "ADMIN" ? "an admin" : v === "MODERATOR" ? "a moderator" : "a user";
                          updateRole.mutate(
                            { userId: u.id, role: v as UserRole },
                            {
                              onSuccess: () => toast.success(`${u.name} is now ${roleLabel}.`),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to update role."),
                            },
                          );
                        }}
                      >
                        <SelectTrigger className="w-32" title={u.id === currentUser?.id ? "You cannot change your own role" : undefined}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="MODERATOR">Moderator</SelectItem>
                          <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "secondary" : "destructive"}>{u.status}</Badge>
                    </TableCell>
                    <TableCell>{u.creditBalance}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={amounts[u.id] ?? 5}
                        onChange={(e) => setAmounts((prev) => ({ ...prev, [u.id]: Number(e.target.value) }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={grantCredit.isPending}
                        onClick={() =>
                          grantCredit.mutate(
                            { userId: u.id, amount: amounts[u.id] ?? 5 },
                            {
                              onSuccess: () => toast.success(`Granted credits to ${u.name}.`),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to grant credits."),
                            },
                          )
                        }
                      >
                        Grant
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={u.status === "ACTIVE" ? "destructive" : "outline"}
                        disabled={updateStatus.isPending || u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "You cannot change your own status" : undefined}
                        onClick={() =>
                          updateStatus.mutate(
                            { userId: u.id, status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
                            {
                              onSuccess: () =>
                                toast.success(
                                  u.status === "ACTIVE" ? `Blocked ${u.name}.` : `Unblocked ${u.name}.`,
                                ),
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to update status."),
                            },
                          )
                        }
                      >
                        {u.status === "ACTIVE" ? "Block" : "Unblock"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <UserDetailSheet user={u} />
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
