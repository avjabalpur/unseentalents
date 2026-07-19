"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAdminSlides, useCreateSlide, useUpdateSlide } from "@/lib/hooks/useAdmin";
import { ApiError, mediaUrl } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminSlidesPage() {
  const { data: slides, isLoading } = useAdminSlides();
  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);

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
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create slide."),
      },
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Hero Slider</h1>
      <p className="-mt-4 text-sm text-muted-foreground">
        Configure the homepage image slider. Provide separate images for desktop and mobile so each
        crops correctly; mobile falls back to the desktop image if omitted.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Add slide</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
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
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Desktop image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setMobileImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" className="sm:col-span-2 sm:w-fit" disabled={createSlide.isPending}>
              {createSlide.isPending ? "Uploading…" : "Add slide"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All slides</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
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
