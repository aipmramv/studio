
// src/app/(app)/stores/manage/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ManageStoresPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Stores"
        description="Create and manage store locations."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Store
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Store List</CardTitle>
          <CardDescription>A list of all configured stores and options to create new ones will be available here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will allow administrators to define and manage different store locations within the organization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
