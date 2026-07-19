"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdminUsers, useGrantCredit } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const grantCredit = useGrantCredit();
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
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
                {users?.map((u) => (
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
