"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdminUsers, useGrantCredit } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import type { UserRole } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/admin/EmptyState";
import { UserSearch } from "lucide-react";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const grantCredit = useGrantCredit();
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const filteredUsers = (users ?? []).filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={UserSearch} title="No users found" description="Try adjusting your search or role filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Grant credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
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
