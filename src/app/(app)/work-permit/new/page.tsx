// src/app/(app)/work-permit/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkPermitForm } from "@/components/forms/WorkPermitForm";

export default function NewWorkPermitPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Work Permit Request"
        description="Complete the form below to request a Work Permit from your Department Head and relevant safety/operational teams for approval."
      />
      <WorkPermitForm />
    </div>
  );
}
