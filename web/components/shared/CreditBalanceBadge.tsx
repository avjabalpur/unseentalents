"use client";

import { Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCreditBalance } from "@/lib/hooks/useCredits";
import { Badge } from "@/components/ui/badge";

export function CreditBalanceBadge() {
  const { user } = useAuth();
  const { data } = useCreditBalance(!!user);

  if (!user) return null;

  const balance = data?.creditBalance ?? user.creditBalance;

  return (
    <Badge variant="outline" className="gap-1 font-medium">
      <Coins className="size-3.5" />
      {balance} credit{balance === 1 ? "" : "s"}
    </Badge>
  );
}
