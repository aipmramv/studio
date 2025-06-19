
// src/app/(app)/scrap-movement/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { ScrapMovementForm } from "@/components/forms/ScrapMovementForm";

export default function NewScrapMovementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Scrap Disposal Request"
        description="Submit a request for scrap material disposal. This will be routed for approval (Dept. Head -> Finance -> MM Head). Include Gate Pass Number if available."
      />
      <ScrapMovementForm />
    </div>
  );
}
