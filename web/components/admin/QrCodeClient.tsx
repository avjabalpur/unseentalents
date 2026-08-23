"use client";

import { useMemo, useRef, useState } from "react";
import { Download, QrCode as QrCodeIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Breadcrumb, type BreadcrumbItem } from "@/components/admin/Breadcrumb";

const DEFAULT_BREADCRUMB_BASE: BreadcrumbItem[] = [{ label: "Dashboard", href: "/admin" }];

function normalizeUrl(raw: string): { url: string | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: null, error: null };

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { url: null, error: "Only http:// and https:// links are supported." };
    }
    return { url: parsed.toString(), error: null };
  } catch {
    return { url: null, error: "Enter a valid URL." };
  }
}

export function QrCodeClient({
  breadcrumbBase = DEFAULT_BREADCRUMB_BASE,
}: {
  breadcrumbBase?: BreadcrumbItem[];
}) {
  const [raw, setRaw] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { url, error } = useMemo(() => normalizeUrl(raw), [raw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      <Breadcrumb items={[...breadcrumbBase, { label: "QR Code" }]} />

      <Card className="shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
          <CardDescription>
            Paste any link — an event page, a poster promotion, a social profile — and get a scannable QR code
            back. Nothing is saved; download the PNG and use it wherever you need.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="qr-url">Destination URL</Label>
              <Input
                id="qr-url"
                inputSize="lg"
                placeholder="https://secretwhiz.com/events/your-event"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                aria-invalid={!!error}
              />
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Scanning this code will open exactly this link — nothing more.
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 justify-self-center">
              <div className="flex size-[184px] items-center justify-center rounded-xl border border-border bg-white p-3">
                {url ? (
                  <QRCodeCanvas
                    ref={canvasRef}
                    value={url}
                    size={160}
                    level="H"
                    marginSize={0}
                    fgColor="#7000ff"
                    bgColor="#ffffff"
                  />
                ) : (
                  <QrCodeIcon className="size-10 text-muted-foreground/40" />
                )}
              </div>
              <Button onClick={handleDownload} disabled={!url} size="sm" className="w-full">
                <Download />
                Download PNG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
