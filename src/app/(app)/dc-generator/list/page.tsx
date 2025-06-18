
// src/app/(app)/dc-generator/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function DeliveryChallanListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="View Delivery Challans (DCs)"
        description="View and manage all generated Delivery Challans."
        actions={
          <Button asChild>
            <Link href="/dc-generator">
              <PlusCircle className="w-4 h-4 mr-2" /> Generate New DC
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Delivery Challan List</CardTitle>
          <CardDescription>A table of Delivery Challans would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all Delivery Challans.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
