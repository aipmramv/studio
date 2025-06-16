
// src/app/(app)/purchase-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Purchase Order"
        description="Fill in the details below to create a new purchase order."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Purchase Order Form</CardTitle>
          <CardDescription>This form will allow creation of new purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. The purchase order creation form will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
