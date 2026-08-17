"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitOrganizerApplication } from "@/lib/hooks/useOrganizerApplications";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ID_DOCUMENT_TYPES = ["Passport", "National ID / Aadhar", "Driver's License", "Other government ID"];

export function OrganizerApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const submitApplication = useSubmitOrganizerApplication();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [legalName, setLegalName] = useState("");
  const [address, setAddress] = useState("");
  const [idDocumentType, setIdDocumentType] = useState("");
  const [idDocumentNumber, setIdDocumentNumber] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const isValid =
    legalName.trim() && address.trim() && idDocumentType && idDocumentNumber.trim() && file !== null;

  const handleSubmit = () => {
    if (!isValid || !file) return;
    submitApplication.mutate(
      {
        legalName: legalName.trim(),
        address: address.trim(),
        idDocumentType,
        idDocumentNumber: idDocumentNumber.trim(),
        organizationName: organizationName.trim() || undefined,
        reason: reason.trim() || undefined,
        file,
      },
      {
        onSuccess: () => {
          toast.success("Application submitted — an admin will review it soon.");
          onSubmitted();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to submit application."),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to become an organizer</CardTitle>
        <CardDescription>
          Organizers can create and run their own events. Since real prizes and credits are involved, every
          application is reviewed by an admin, including a government ID for identity verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Legal name</Label>
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="As on your ID" />
          </div>
          <div className="space-y-1.5">
            <Label>Organization name (optional)</Label>
            <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Address</Label>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>ID document type</Label>
            <Select value={idDocumentType} onValueChange={(v) => v && setIdDocumentType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a document type" />
              </SelectTrigger>
              <SelectContent>
                {ID_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ID document number</Label>
            <Input value={idDocumentNumber} onChange={(e) => setIdDocumentNumber(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Why do you want to organize events? (optional)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label>Upload your ID document</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {file ? "Change file" : "Choose file"}
            </Button>
            <span className="text-sm text-muted-foreground">{file ? file.name : "No file selected"}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Only reviewed by admins for identity verification — never shown publicly.
          </p>
        </div>

        <Button onClick={handleSubmit} disabled={!isValid || submitApplication.isPending}>
          {submitApplication.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </CardContent>
    </Card>
  );
}
