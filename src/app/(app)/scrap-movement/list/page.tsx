// src/app/(app)/scrap-movement/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ScrapMovementListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Movement Requests"
        description="View and manage all scrap movement requests."
        actions={
          <Button asChild>
            <Link href="/scrap-movement/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Request
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Request List</CardTitle>
          <CardDescription>A table of scrap movement requests would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all scrap movement requests.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
