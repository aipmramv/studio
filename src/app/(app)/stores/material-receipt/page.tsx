
// src/app/(app)/stores/material-receipt/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function MaterialReceiptPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Receipt"
        description="Record incoming materials into stores."
        actions={
          <Button>
            {/* This might link to a specific form page in the future */}
            <PlusCircle className="w-4 h-4 mr-2" /> New Material Receipt
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Material Receipt Log</CardTitle>
          <CardDescription>A table of material receipts will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will list all material receipts and provide options to create new ones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
