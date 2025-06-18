// src/app/(app)/sale-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { SaleOrderForm } from "@/components/forms/SaleOrderForm";

export default function NewSaleOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Sale Order Request"
        description="Request approval for a Sale Order. Once approved and created in SAP, the SO number will be updated here for tracking."
      />
      <SaleOrderForm />
    </div>
  );
}
