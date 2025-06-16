
// src/app/(app)/sale-order/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function SaleOrderListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Sale Order Requests"
        description="View and manage all sale order requests."
        actions={
          <Button asChild>
            <Link href="/sale-order/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Sale Order
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Sale Order List</CardTitle>
          <CardDescription>A table of sale orders would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all sale orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
