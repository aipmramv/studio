// src/app/(app)/purchase-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { PurchaseOrderForm } from "@/components/forms/PurchaseOrderForm";

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Purchase Order Request"
        description="Request budget and approval for a Purchase Order. Once approved and created in SAP, the PO number will be updated here for tracking."
      />
      <PurchaseOrderForm />
    </div>
  );
}
