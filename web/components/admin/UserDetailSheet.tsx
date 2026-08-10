"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { User } from "@/types/api";
import { formatDate } from "@/lib/format";
import { useUserCreditTransactions, useUserHistory, useUserSubmissions } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}

export function UserDetailSheet({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const { data: submissions, isLoading: submissionsLoading } = useUserSubmissions(open ? user.id : undefined);
  const { data: transactions, isLoading: transactionsLoading } = useUserCreditTransactions(open ? user.id : undefined);
  const { data: history, isLoading: historyLoading } = useUserHistory(open ? user.id : undefined);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" variant="outline" aria-label="View user details" />}>
        <Eye className="size-4" />
      </SheetTrigger>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-6">
          <Section title="Profile">
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="text-right">@{user.username}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate text-right" title={user.email}>
                {user.email}
              </dd>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="text-right">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right">
                <Badge variant={user.status === "ACTIVE" ? "secondary" : "destructive"}>{user.status}</Badge>
              </dd>
              <dt className="text-muted-foreground">Credits</dt>
              <dd className="text-right">{user.creditBalance}</dd>
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="text-right">{formatDate(user.createdAt)}</dd>
            </dl>
          </Section>

          <Separator />

          <Section title={`Submissions (${submissions?.length ?? 0})`}>
            {submissionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !submissions || submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {submissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{s.title || "Untitled entry"}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.voteCount} votes</span>
                      <Badge variant={s.status === "APPROVED" ? "secondary" : "outline"}>{s.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Separator />

          <Section title={`Credit transactions (${transactions?.length ?? 0})`}>
            {transactionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {transactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.type.replace(/_/g, " ")}</span>
                    <span className={t.amount >= 0 ? "text-foreground" : "text-destructive"}>
                      {t.amount >= 0 ? "+" : ""}
                      {t.amount} <span className="text-xs text-muted-foreground">(bal. {t.balanceAfter})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Separator />

          <Section title="Account history">
            <ActivityTimeline logs={history} isLoading={historyLoading} />
          </Section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
