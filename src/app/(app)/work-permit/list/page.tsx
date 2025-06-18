// src/app/(app)/work-permit/list/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function WorkPermitListPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Work Permit Requests"
        description="View and manage all work permit requests."
        actions={
          <Button asChild>
            <Link href="/work-permit/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Permit
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Permit List</CardTitle>
          <CardDescription>A table of work permits would be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will show a sortable and filterable list of all work permits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
