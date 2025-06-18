
// src/app/(app)/masters/building-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuildingTypesMasterPage_DEPRECATED() {
  // This component is deprecated and its functionality moved to /masters/store-locations
  return (
    <div className="space-y-8">
      <PageHeader
        title="Building Types Master (DEPRECATED)"
        description="This page has been consolidated into 'Store Locations' master."
      />
      <Card>
        <CardHeader>
          <CardTitle>Functionality Moved</CardTitle>
          <CardDescription>
            The concept of 'Building Types' has been merged with 'Store Locations'. 
            Please manage all locations and their types under the 'Store Locations' page in the 'Masters' section.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-destructive">This page is no longer actively used and can be removed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
