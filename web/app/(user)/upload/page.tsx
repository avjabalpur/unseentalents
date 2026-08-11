import { UploadWizard } from "@/components/user/UploadWizard";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Share your talent</p>
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide sm:text-3xl">
        Upload <span className="text-primary">your entry</span>
      </h1>
      <div className="mt-3 mb-6 h-[3px] w-16 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <p className="mb-8 max-w-xl text-muted-foreground">
        Choose a category and competition, then upload your video or photo.
      </p>
      <UploadWizard />
    </div>
  );
}
