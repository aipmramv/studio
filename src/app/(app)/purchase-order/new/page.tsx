
// src/app/(app)/purchase-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { PurchaseOrderForm } from "@/components/forms/PurchaseOrderForm";

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Purchase Order"
        description="Fill in the details below to create a new purchase order."
      />
      <PurchaseOrderForm />
    </div>
  );
}
