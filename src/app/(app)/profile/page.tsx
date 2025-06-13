// src/app/(app)/profile/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="User Profile"
        description="Manage your personal information and settings."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your profile information will be displayed and editable here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Feature under development. This page will allow users to view and update their profile details,
            change passwords, and manage notification preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
