// src/app/(app)/work-permit/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkPermitForm } from "@/components/forms/WorkPermitForm";

export default function NewWorkPermitPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Work Permit Request"
        description="Submit a request for a work permit by providing activity details and necessary attachments."
      />
      <WorkPermitForm />
    </div>
  );
}
