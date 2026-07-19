"use client";

import DOMPurify from "isomorphic-dompurify";
import { useTopic } from "@/lib/hooks/useTopics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function TermsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: topic, isLoading } = useTopic("terms-and-conditions");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{topic?.title ?? "Terms and Conditions"}</DialogTitle>
          {topic?.subtitle && <DialogDescription>{topic.subtitle}</DialogDescription>}
        </DialogHeader>
        {isLoading || !topic ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div
            className="max-w-none text-sm text-white/90 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:first:mt-0 [&_p]:mb-3 [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(topic.htmlContent) }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
