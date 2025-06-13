// src/app/(app)/scrap-movement/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { ScrapMovementForm } from "@/components/forms/ScrapMovementForm";

export default function NewScrapMovementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Scrap Movement Request"
        description="Log details for scrap material disposal."
      />
      <ScrapMovementForm />
    </div>
  );
}
