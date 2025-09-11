// src/app/(app)/asset-management/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import { type AssetManagementFormData } from "@/lib/schemas";
import { mockAssetData } from "@/lib/mock-asset-data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function NewAssetPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (data: AssetManagementFormData) => {
        const newAsset: AssetManagementFormData = {
            ...data,
            id: `ASSET-${Date.now()}` // Create a unique ID
        };
        // In a real app, you'd send this to an API. Here we just update the mock data.
        mockAssetData.unshift(newAsset); 
        toast({
            title: "Asset Added Successfully",
            description: `Asset ${newAsset.assetNumber} has been added to the register.`,
        });
        router.push('/asset-management/list'); // Redirect back to the list
    };

    const handleCancel = () => {
        router.push('/asset-management/list');
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Add New Asset"
                description="Fill in the details for the new asset. All fields marked with an asterisk are required."
            />
            <AssetManagementForm 
                onSave={handleSave} 
                onCancel={handleCancel}
            />
        </div>
    );
}
