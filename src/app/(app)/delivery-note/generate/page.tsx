
// src/app/(app)/delivery-note/generate/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { DeliveryNoteGeneratorContent } from "@/components/features/DeliveryNoteGeneratorContent";

export default function GenerateDeliveryNotePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Generate Delivery Note"
        description="Auto-generate and finalize Delivery Notes from approved requests."
      />
      <DeliveryNoteGeneratorContent />
    </div>
  );
}
