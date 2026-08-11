import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading text-2xl tracking-tight text-foreground", className)}>
      Secret<span className="text-primary">Whiz</span>
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary",
        className,
      )}
    >
      SW
    </span>
  );
}
