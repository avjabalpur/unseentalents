import { UploadWizard } from "@/components/user/UploadWizard";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Upload Your Entry</h1>
      <p className="mb-8 text-muted-foreground">
        Choose a category and competition, then upload your video or photo.
      </p>
      <UploadWizard />
    </div>
  );
}
