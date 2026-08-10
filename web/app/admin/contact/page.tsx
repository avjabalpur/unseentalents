"use client";

import { useAdminContactMessages, useMarkContactMessageRead } from "@/lib/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListCardSkeleton } from "@/components/admin/CardGridSkeleton";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "@/components/admin/EmptyState";
import { Mail as MailIcon } from "lucide-react";

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
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Contact Messages" }]} />

      {isLoading ? (
        <ListCardSkeleton />
      ) : !messages || messages.length === 0 ? (
        <EmptyState
          icon={MailIcon}
          title="No messages yet"
          description="Submissions from the Contact Us form will appear here."
        />
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={cn("shadow-md shadow-black/20", message.isRead ? "opacity-70" : "")}
            >
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
                <p className="whitespace-pre-wrap text-sm text-foreground/90">{message.message}</p>
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
