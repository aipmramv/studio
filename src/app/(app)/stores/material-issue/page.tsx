
// src/app/(app)/stores/material-issue/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function MaterialIssuePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Issue"
        description="Record materials issued from stores."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> New Material Issue
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Material Issue Log</CardTitle>
          <CardDescription>A table of material issues will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will list all material issues and allow for new issue entries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
