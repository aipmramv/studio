
// src/app/(app)/stores/audit/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function StoresAuditPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Stores Audit"
        description="View and manage store audit records."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Start New Audit
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Store Audit Records</CardTitle>
          <CardDescription>A list of store audits and their findings will be displayed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will facilitate store audits, including scheduling, recording findings, and tracking actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
