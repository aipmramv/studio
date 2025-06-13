// src/app/(app)/dc-generator/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { DcGeneratorContent } from "@/components/features/DcGeneratorContent";

export default function DcGeneratorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Delivery Challan (DC) Generator"
        description="Auto-generate and finalize Delivery Challans from approved requests."
      />
      <DcGeneratorContent />
    </div>
  );
}
