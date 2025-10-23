
// src/app/(app)/asset-management/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import { type AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";

export default function NewAssetPage() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();

    const handleSave = (data: AssetManagementFormData) => {
        if (!firestore) {
            toast({ title: "Firestore not available", variant: "destructive" });
            return;
        }

        const dataToClean: Partial<AssetManagementFormData> = { ...data };

        // Firestore does not allow `undefined` values.
        if (dataToClean.attachments && Object.values(dataToClean.attachments).every(v => v === undefined || v === null || v === '')) {
            delete dataToClean.attachments;
        }
        
        const dataToSave = {
            ...dataToClean,
            capitalizationDate: data.capitalizationDate ? new Date(data.capitalizationDate).toISOString() : null,
            eolDate: data.eolDate ? new Date(data.eolDate).toISOString() : null,
            verifiedOn: data.verifiedOn ? new Date(data.verifiedOn).toISOString() : null,
            statusChangedOn: new Date().toISOString(),
        };
        
        const assetsCollection = collection(firestore, "assets");
        addDocumentNonBlocking(assetsCollection, dataToSave);

        toast({
            title: "Asset Added Successfully",
            description: `Asset ${dataToSave.assetNumber} has been added to the register.`,
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

    
