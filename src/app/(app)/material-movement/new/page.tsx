// src/app/(app)/material-movement/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialMovementForm } from "@/components/forms/MaterialMovementForm";

export default function NewMaterialMovementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Movement Request"
        description="Fill in the details below to log a new material movement."
      />
      <MaterialMovementForm />
    </div>
  );
}
