
// src/app/(app)/purchase-order/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function PurchaseOrderListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Purchase Order Requests"
        description="View and manage all purchase order requests."
        actions={
          <Button asChild>
            <Link href="/purchase-order/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Purchase Order
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>A table of purchase orders would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all purchase orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
