"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAdminSlides, useCreateSlide, useUpdateSlide } from "@/lib/hooks/useAdmin";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

function CreateSlideSheet() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const createSlide = useCreateSlide();

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error("A desktop image is required.");
      return;
    }
    createSlide.mutate(
      { title, subtitle, linkUrl, orderIndex, active: true, image, mobileImage: mobileImage ?? undefined },
      {
        onSuccess: () => {
          toast.success("Slide created.");
          setTitle("");
          setSubtitle("");
          setLinkUrl("");
          setImage(null);
          setMobileImage(null);
          setOrderIndex((n) => n + 1);
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create slide."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Add slide
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add slide</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <form id="create-slide-form" onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle (optional)</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Link URL (optional)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/events/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Desktop image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile image (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setMobileImage(e.target.files?.[0] ?? null)} />
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          <Button type="submit" form="create-slide-form" disabled={createSlide.isPending}>
            {createSlide.isPending ? "Uploading…" : "Add slide"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminSlidesPage() {
  const { data: slides, isLoading } = useAdminSlides();
  const updateSlide = useUpdateSlide();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Hero Slider" }]} />
        <CreateSlideSheet />
      </div>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All slides</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides?.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(slide.imageKey) ?? undefined}
                        alt={slide.title ?? "Slide"}
                        className="h-12 w-20 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{slide.title ?? "—"}</TableCell>
                    <TableCell>{slide.orderIndex}</TableCell>
                    <TableCell>
                      <Badge variant={slide.active ? "default" : "secondary"}>
                        {slide.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateSlide.isPending}
                        onClick={() =>
                          updateSlide.mutate(
                            { slideId: slide.id, active: !slide.active },
                            {
                              onError: (err) =>
                                toast.error(err instanceof ApiError ? err.message : "Failed to update slide."),
                            },
                          )
                        }
                      >
                        {slide.active ? "Deactivate" : "Activate"}
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
