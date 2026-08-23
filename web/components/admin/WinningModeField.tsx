import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WinningMode } from "@/types/api";

const OPTIONS: { value: WinningMode; label: string; description: string }[] = [
  {
    value: "AUDIENCE_VOTE",
    label: "Audience vote",
    description: "The public votes on entries — the highest vote count wins/advances.",
  },
  {
    value: "JUDGE_SCORE",
    label: "Judge score",
    description: "1–5 assigned judges score each entry — the highest total wins/advances.",
  },
  {
    value: "ADMIN_CURATED",
    label: "Admin curated",
    description: "No automatic scoring — you manually pick who advances at each round.",
  },
];

export function WinningModeField({
  value,
  onChange,
}: {
  value: WinningMode;
  onChange: (value: WinningMode) => void;
}) {
  const selected = OPTIONS.find((o) => o.value === value);

  return (
    <div className="space-y-1.5">
      <Label>How will winners be decided?</Label>
      <Select value={value} onValueChange={(v) => v && onChange(v as WinningMode)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && <p className="text-xs text-muted-foreground">{selected.description}</p>}
    </div>
  );
}
