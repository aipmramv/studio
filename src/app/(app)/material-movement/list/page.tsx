// src/app/(app)/material-movement/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

// This is a placeholder page. A real implementation would fetch and display a list.
export default function MaterialMovementListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Movement Requests"
        description="View and manage all material movement requests."
        actions={
          <Button asChild>
            <Link href="/material-movement/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Request
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Request List</CardTitle>
          <CardDescription>A table of material movement requests would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all material movement requests,
            including their status, requester, dates, and key details.
          </p>
          {/* Placeholder for a TanStack Table or similar component */}
        </CardContent>
      </Card>
    </div>
  );
}
