"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAdminCoupons, useCreateCoupon } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollapsibleFormCard } from "@/components/admin/CollapsibleFormCard";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useAdminCoupons();
  const createCoupon = useCreateCoupon();

  const [formOpen, setFormOpen] = useState(false);
  const [code, setCode] = useState("");
  const [creditValue, setCreditValue] = useState(5);
  const [maxRedemptions, setMaxRedemptions] = useState(100);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createCoupon.mutate(
      { code: code.toUpperCase(), creditValue, maxRedemptions },
      {
        onSuccess: () => {
          toast.success("Coupon created.");
          setCode("");
          setFormOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create coupon."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Coupons" }]} />

      <CollapsibleFormCard
        title="Create coupon"
        triggerLabel="Add coupon"
        open={formOpen}
        onOpenChange={setFormOpen}
      >
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Credit value</Label>
            <Input
              type="number"
              min={1}
              value={creditValue}
              onChange={(e) => setCreditValue(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max redemptions</Label>
            <Input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(Number(e.target.value))}
            />
          </div>
          <Button type="submit" className="sm:col-span-3 sm:w-fit" disabled={createCoupon.isPending}>
            {createCoupon.isPending ? "Creating…" : "Create coupon"}
          </Button>
        </form>
      </CollapsibleFormCard>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell>{c.creditValue}</TableCell>
                    <TableCell>
                      {c.redemptionsCount} / {c.maxRedemptions}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
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
