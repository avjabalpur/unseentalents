"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminSettings, useUpdateSiteSettings } from "@/lib/hooks/useAdmin";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSiteSettings();

  const [welcomeCreditAmount, setWelcomeCreditAmount] = useState(0);
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (!settings) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of the edit form once the fetch resolves
    setWelcomeCreditAmount(settings.welcomeCreditAmount);
    setMaxUploadSizeMb(settings.maxUploadSizeMb);
    setMaintenanceMode(settings.maintenanceMode);
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      { welcomeCreditAmount, maxUploadSizeMb, maintenanceMode },
      {
        onSuccess: () => toast.success("Settings saved."),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save settings."),
      },
    );
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]} />

      <Card className="max-w-lg shadow-md shadow-black/20">
        <CardHeader>
          <CardTitle>Platform settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Welcome credit amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={welcomeCreditAmount}
                  onChange={(e) => setWelcomeCreditAmount(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Credits granted automatically when a new user signs up.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Max upload size (MB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxUploadSizeMb}
                  onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={maintenanceMode} onCheckedChange={(v) => setMaintenanceMode(v === true)} />
                Maintenance mode
              </label>
              <Button onClick={handleSave} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
