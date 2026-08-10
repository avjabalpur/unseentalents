"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({ path, filename, label = "Export CSV" }: { path: string; filename: string; label?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async () => {
    setIsDownloading(true);
    try {
      await apiClient.download(path, filename);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to export CSV.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isDownloading}>
      <Download className="size-4" />
      {isDownloading ? "Exporting…" : label}
    </Button>
  );
}
