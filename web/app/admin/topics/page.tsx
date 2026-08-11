"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdminTopics, useCreateTopic, useUpdateTopic, type TopicPayload } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import type { Topic, TopicStatus } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, SearchX } from "lucide-react";

const EMPTY_FORM: TopicPayload = {
  key: "",
  title: "",
  subtitle: "",
  htmlContent: "",
  featured: false,
  status: "DRAFT",
};

export default function AdminTopicsPage() {
  const { data: topics, isLoading } = useAdminTopics();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TopicPayload>(EMPTY_FORM);

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setForm({
      key: topic.key,
      title: topic.title,
      subtitle: topic.subtitle ?? "",
      htmlContent: topic.htmlContent,
      featured: topic.featured,
      status: topic.status,
    });
    setFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(false);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateTopic.mutate(
        { topicId: editingId, payload: form },
        {
          onSuccess: () => {
            toast.success("Topic updated.");
            resetForm();
          },
          onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update topic."),
        },
      );
    } else {
      createTopic.mutate(form, {
        onSuccess: () => {
          toast.success("Topic created.");
          resetForm();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create topic."),
      });
    }
  };

  const isSaving = createTopic.isPending || updateTopic.isPending;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TopicStatus | "ALL">("ALL");

  const filteredTopics = (topics ?? []).filter((topic) => {
    const matchesSearch =
      !search ||
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      topic.key.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || topic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Topics" }]} />
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Add topic
        </Button>
      </div>

      <Sheet open={formOpen} onOpenChange={(next) => (next ? setFormOpen(true) : resetForm())}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit topic" : "Create topic"}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Key (used in URL /pages/key)</Label>
              <Input
                value={form.key}
                disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="e.g. whats-new"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as TopicStatus }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Content</Label>
              <RichTextEditor
                value={form.htmlContent}
                onChange={(html) => setForm((f) => ({ ...f, htmlContent: html }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Featured on home page (max 3 shown)
            </label>
          </SheetBody>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={isSaving || !form.key || !form.title}>
              {isSaving ? "Saving…" : editingId ? "Save changes" : "Create topic"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>All topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Search by title or key…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as TopicStatus | "ALL")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : filteredTopics.length === 0 ? (
            <EmptyState icon={SearchX} title="No topics found" description="Try adjusting your search or status filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.map((topic) => (
                  <TableRow key={topic.id}>
                    <TableCell className="font-mono text-sm">{topic.key}</TableCell>
                    <TableCell className="font-medium">{topic.title}</TableCell>
                    <TableCell>
                      <Badge variant={topic.status === "PUBLISHED" ? "default" : "secondary"}>
                        {topic.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{topic.featured ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => startEdit(topic)}>
                        Edit
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
