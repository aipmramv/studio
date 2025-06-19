
// src/app/(app)/material-movement/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialMovementForm } from "@/components/forms/MaterialMovementForm";

export default function NewMaterialMovementPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Movement Request"
        description="Initiate a material movement by filling the form. This request will be routed for approval (Dept. Head -> Dispatch -> Finance if applicable)."
      />
      <MaterialMovementForm />
    </div>
  );
}
