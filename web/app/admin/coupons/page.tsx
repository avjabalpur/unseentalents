"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Coupon, CouponStatus } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

function CreateCouponSheet() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [creditValue, setCreditValue] = useState(5);
  const [maxRedemptions, setMaxRedemptions] = useState(100);
  const createCoupon = useCreateCoupon();

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createCoupon.mutate(
      { code: code.toUpperCase(), creditValue, maxRedemptions },
      {
        onSuccess: () => {
          toast.success("Coupon created.");
          setCode("");
          setCreditValue(5);
          setMaxRedemptions(100);
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create coupon."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Add coupon
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create coupon</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <form id="create-coupon-form" onSubmit={handleCreate} className="space-y-4">
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
          </form>
        </SheetBody>
        <SheetFooter>
          <Button type="submit" form="create-coupon-form" disabled={createCoupon.isPending}>
            {createCoupon.isPending ? "Creating…" : "Create coupon"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditCouponSheet({ coupon }: { coupon: Coupon }) {
  const [open, setOpen] = useState(false);
  const [creditValue, setCreditValue] = useState(coupon.creditValue);
  const [maxRedemptions, setMaxRedemptions] = useState(coupon.maxRedemptions);
  const [expiresAt, setExpiresAt] = useState(coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "");
  const [status, setStatus] = useState<CouponStatus>(coupon.status);
  const updateCoupon = useUpdateCoupon();

  const handleSave = () => {
    updateCoupon.mutate(
      {
        couponId: coupon.id,
        creditValue,
        maxRedemptions,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        status,
      },
      {
        onSuccess: () => {
          toast.success("Coupon updated.");
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update coupon."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" aria-label="Edit coupon" />}>
        <Pencil className="size-4" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit coupon {coupon.code}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>Credit value</Label>
            <Input type="number" min={1} value={creditValue} onChange={(e) => setCreditValue(Number(e.target.value))} />
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
          <div className="space-y-1.5">
            <Label>Expires on (optional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v as CouponStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SheetBody>
        <SheetFooter>
          <Button onClick={handleSave} disabled={updateCoupon.isPending}>
            {updateCoupon.isPending ? "Saving…" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useAdminCoupons();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Coupons" }]} />
        <CreateCouponSheet />
      </div>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{c.expiresAt ? formatDate(c.expiresAt) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <EditCouponSheet coupon={c} />
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
