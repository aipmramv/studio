// src/app/(app)/material-movement/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialMovementForm } from "@/components/forms/MaterialMovementForm";

export default function NewMaterialMovementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Movement Request"
        description="Fill in the details below to submit a material movement request to your Department Head for approval."
      />
      <MaterialMovementForm />
    </div>
  );
}
