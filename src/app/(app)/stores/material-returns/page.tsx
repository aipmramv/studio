
// src/app/(app)/stores/material-returns/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function MaterialReturnsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Returns"
        description="Record materials returned to stores."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> New Material Return
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Material Return Log</CardTitle>
          <CardDescription>A table of material returns will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will list all material returns and allow logging of new returns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
