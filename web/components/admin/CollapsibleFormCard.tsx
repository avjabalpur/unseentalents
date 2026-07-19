"use client";

import { useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";

export function CollapsibleFormCard({
  title,
  triggerLabel,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
}: {
  title: string;
  triggerLabel: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardAction>
            <CollapsibleTrigger
              render={
                <Button variant="outline" size="sm">
                  {open ? (
                    <>
                      <X className="size-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      {triggerLabel}
                    </>
                  )}
                </Button>
              }
            />
          </CardAction>
        </CardHeader>
        <CollapsiblePanel>
          <CardContent className="pt-4">{children}</CardContent>
        </CollapsiblePanel>
      </Collapsible>
    </Card>
  );
}
