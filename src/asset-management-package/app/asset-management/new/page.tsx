// src/app/(app)/asset-management/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import { type AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { mockAssetData } from "@/lib/mock-asset-data";

export default function NewAssetPage() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = (data: AssetManagementFormData) => {
        const newAsset = {
            ...data,
            id: `ASSET-${Date.now()}`,
            capitalizationDate: data.capitalizationDate ? new Date(data.capitalizationDate) : new Date(),
            eolDate: data.eolDate ? new Date(data.eolDate) : undefined,
            verifiedOn: data.verifiedOn ? new Date(data.verifiedOn) : undefined,
            statusChangedOn: new Date(),
        };

        mockAssetData.unshift(newAsset as AssetManagementFormData);

        toast({
            title: "Asset Added Successfully",
            description: `Asset ${data.assetNumber} has been added to the local mock data.`,
        });
        router.push('/asset-management/list');
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
                isEditing={true}
            />
        </div>
    );
}
