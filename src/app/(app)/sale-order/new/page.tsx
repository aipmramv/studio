
// src/app/(app)/sale-order/new/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSaleOrderPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Sale Order"
        description="Fill in the details below to create a new sale order."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Sale Order Form</CardTitle>
          <CardDescription>This form will allow creation of new sale orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. The sale order creation form will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
