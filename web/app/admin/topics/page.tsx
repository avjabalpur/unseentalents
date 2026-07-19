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
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Topics (CMS pages)</h1>
      <p className="-mt-4 text-sm text-muted-foreground">
        Publish content pages like &quot;What&apos;s New&quot; or &quot;About Us&quot;. Each is available at
        /pages/[key]. Mark a topic &quot;featured&quot; to show it as a teaser block on the home page.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit topic" : "Create topic"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSaving || !form.key || !form.title}>
              {isSaving ? "Saving…" : editingId ? "Save changes" : "Create topic"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All topics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
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
                {topics?.map((topic) => (
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
