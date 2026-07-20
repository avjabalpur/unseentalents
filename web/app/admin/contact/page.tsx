"use client";

import { useAdminContactMessages, useMarkContactMessageRead } from "@/lib/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListCardSkeleton } from "@/components/admin/CardGridSkeleton";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminContactPage() {
  const { data: messages, isLoading } = useAdminContactMessages();
  const markRead = useMarkContactMessageRead();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Contact Messages</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Submissions from the public Contact Us form. Reply directly to the sender&apos;s email —
        outbound email isn&apos;t wired up yet.
      </p>

      {isLoading ? (
        <ListCardSkeleton />
      ) : !messages || messages.length === 0 ? (
        <p className="text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={message.isRead ? "opacity-70" : ""}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>{message.subject}</span>
                  {!message.isRead && <Badge>New</Badge>}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {message.name} &lt;{message.email}&gt; — {formatDateTime(message.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap text-sm text-white/90">{message.message}</p>
                {!message.isRead && (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(message.id)}>
                    Mark as read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
