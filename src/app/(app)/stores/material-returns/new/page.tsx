// src/app/(app)/stores/material-returns/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialReturnForm } from "@/components/forms/MaterialReturnForm";
import { type MaterialReturnFormData } from "@/lib/schemas";
import { mockReturnsData, mockInventoryData, type MaterialReturn } from "@/lib/mock-inventory-data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function NewMaterialReturnPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (data: MaterialReturnFormData) => {
        // Add stock back to inventory
        data.items.forEach(item => {
            const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === item.materialId);
            if (inventoryIndex !== -1) {
                mockInventoryData[inventoryIndex].quantityOnHand += item.quantity;
            } else {
                // If item doesn't exist, create it (simplified)
                mockInventoryData.push({
                    id: item.materialId,
                    name: `New Item - ${item.materialId}`,
                    category: "Raw Material",
                    storeLocation: data.storeLocation,
                    quantityOnHand: item.quantity,
                    unitOfMeasure: "Units",
                    lastUpdated: new Date(),
                    lowStockThreshold: 10,
                });
            }
        });

        const newReturn: MaterialReturn = {
            id: `RET${Date.now()}`,
            ...data,
            returnDate: format(data.returnDate, "yyyy-MM-dd"),
            totalItems: data.items.length,
        };
        mockReturnsData.push(newReturn);
        toast({ title: "Material Return Logged", description: `New return from ${data.returnedBy} has been logged.` });
        router.push("/stores/material-returns/list");
    };

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Return"
        description="Fill the form to log a new material return. This will add quantities back to inventory."
      />
      <MaterialReturnForm 
        onSave={handleSave}
        onCancel={() => router.push("/stores/material-returns/list")}
      />
    </div>
  );
}