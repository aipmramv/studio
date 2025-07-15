// src/app/(app)/stores/material-receipt/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { MaterialReceiptForm } from "@/components/forms/MaterialReceiptForm";
import { type MaterialReceiptFormData } from "@/lib/schemas";
import { mockReceiptsData, mockInventoryData, type MaterialReceipt } from "@/lib/mock-inventory-data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function NewMaterialReceiptPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (data: MaterialReceiptFormData) => {
        // Add items to inventory
        data.items.forEach(item => {
            const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === item.materialId);
            if (inventoryIndex !== -1) {
                mockInventoryData[inventoryIndex].quantityOnHand += item.quantity;
            } else {
                // If item doesn't exist, add it to inventory (simplified)
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

        const newReceipt: MaterialReceipt = {
            id: `REC${Date.now()}`,
            ...data,
            receiptDate: format(data.receiptDate, "yyyy-MM-dd"),
            totalItems: data.items.length,
        };
        mockReceiptsData.push(newReceipt);
        toast({ title: "Material Receipt Logged", description: `New receipt from ${data.vendorName} has been logged.` });
        router.push("/stores/material-receipt/list");
    };

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Material Receipt"
        description="Fill the form to log a new material receipt. This will add quantities to the inventory."
      />
      <MaterialReceiptForm 
        onSave={handleSave}
        onCancel={() => router.push("/stores/material-receipt/list")}
      />
    </div>
  );
}