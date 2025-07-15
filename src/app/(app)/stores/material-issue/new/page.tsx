// src/app/(app)/stores/material-issue/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialIssueForm } from "@/components/forms/MaterialIssueForm";
import { type MaterialIssueFormData } from "@/lib/schemas";
import { mockIssuesData, mockInventoryData, type MaterialIssue } from "@/lib/mock-inventory-data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function NewMaterialIssuePage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (data: MaterialIssueFormData) => {
        let allItemsValid = true;
        data.items.forEach(itemToIssue => {
            const inventoryItem = mockInventoryData.find(inv => inv.id === itemToIssue.materialId);
            if (!inventoryItem || inventoryItem.quantityOnHand < itemToIssue.quantity) {
                allItemsValid = false;
                toast({
                    title: "Insufficient Stock",
                    description: `Not enough stock for ${itemToIssue.materialId}. Available: ${inventoryItem?.quantityOnHand || 0}.`,
                    variant: "destructive"
                });
            }
        });

        if (!allItemsValid) return;

        // Deduct from inventory
        data.items.forEach(itemToIssue => {
            const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === itemToIssue.materialId);
            if (inventoryIndex !== -1) {
                mockInventoryData[inventoryIndex].quantityOnHand -= itemToIssue.quantity;
            }
        });
        
        const newIssue: MaterialIssue = {
            issueId: `ISS${Date.now()}`,
            ...data,
            id: `ISS${Date.now()}`,
            issueDate: format(data.issueDate, "yyyy-MM-dd"),
            totalItems: data.items.length,
        };
        mockIssuesData.push(newIssue);
        toast({ title: "Material Issue Logged", description: `New issue for ${data.issuedTo} has been logged.` });
        router.push("/stores/material-issue/list");
    };


  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Issue"
        description="Fill the form to log a new material issue. This will deduct quantities from the inventory."
      />
      <MaterialIssueForm 
        onSave={handleSave}
        onCancel={() => router.push("/stores/material-issue/list")}
      />
    </div>
  );
}