
// src/app/(app)/delivery-note/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function DeliveryNoteListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="View Delivery Notes"
        description="View and manage all generated Delivery Notes."
        actions={
          <Button asChild>
            <Link href="/delivery-note/generate">
              <PlusCircle className="w-4 h-4 mr-2" /> Generate New Note
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Delivery Note List</CardTitle>
          <CardDescription>A table of Delivery Notes would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all Delivery Notes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
