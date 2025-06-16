
// src/app/(app)/sale-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { SaleOrderForm } from "@/components/forms/SaleOrderForm";

export default function NewSaleOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Sale Order"
        description="Fill in the details below to create a new sale order."
      />
      <SaleOrderForm />
    </div>
  );
}
