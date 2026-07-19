"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useComments, useCreateComment } from "@/lib/hooks/useComments";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentSection({ submissionId }: { submissionId: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { data: comments, isLoading } = useComments(submissionId);
  const createComment = useCreateComment(submissionId);
  const [content, setContent] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment.mutate(content.trim(), {
      onSuccess: () => setContent(""),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to post comment."),
    });
  };

  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold uppercase tracking-wide">
        <MessageCircle className="size-5 text-primary" />
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <Textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment…"
          />
          <Button type="submit" size="sm" disabled={createComment.isPending || !content.trim()}>
            {createComment.isPending ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="text-primary underline">
            Log in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : !comments || comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet — be the first to say something.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-white/10 pb-4 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-white">
                  {comment.authorUsername ? `@${comment.authorUsername}` : comment.authorName}
                </span>
                <span className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-white/80">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
