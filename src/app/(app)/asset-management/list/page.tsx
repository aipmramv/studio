
// src/app/(app)/asset-management/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Search, ChevronsLeft, ChevronsRight, Upload, ListFilter, FileSpreadsheet, FileText, Trash2, Eye, History, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import type { AssetData } from "@/types/asset";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 10;

export default function AssetListPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [assets, setAssets] = React.useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalAssets, setTotalAssets] = React.useState(0);

  const [editingAsset, setEditingAsset] = React.useState<AssetData | null>(null);
  const [viewingAssetMedia, setViewingAssetMedia] = React.useState<AssetData | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({});

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterDepartment, setFilterDepartment] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [filterClassification, setFilterClassification] = React.useState("");
  const [filterLocation, setFilterLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const isUserAdmin = user?.role === 'admin';

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", ITEMS_PER_PAGE.toString());
      if (searchTerm) params.append("search", searchTerm);
      if (filterDepartment) params.append("department", filterDepartment);
      if (filterStatus) params.append("status", filterStatus);
      if (filterClassification) params.append("classification", filterClassification);
      if (filterLocation) params.append("location", filterLocation);

      const response = await fetch(`/api/assets?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAssets(data.data.assets);
        setTotalAssets(data.data.total);
      } else {
        setError(data.message || "Failed to fetch assets");
      }
    } catch (err) {
      setError("An error occurred while fetching assets.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssets();
  }, [currentPage, searchTerm, filterDepartment, filterStatus, filterClassification, filterLocation]);

  const totalPages = Math.ceil(totalAssets / ITEMS_PER_PAGE);
  const selectedCount = Object.keys(selectedRows).filter(k => selectedRows[k]).length;

  const openEditDialog = (asset: AssetData) => {
    setEditingAsset(asset);
  };

  const openImageDialog = (asset: AssetData) => {
    setViewingAssetMedia(asset);
    setIsImageDialogOpen(true);
  };
  
  const openHistoryDialog = (asset: AssetData) => {
    setViewingAssetMedia(asset);
    setIsHistoryDialogOpen(true);
  };

  const handleBulkUpload = () => {
    toast({ title: "File uploaded successfully!", description: "Asset data will be processed. This is a mock action." });
    setIsUploadDialogOpen(false);
  }

  const handleSave = async (data: AssetData) => {
    if (editingAsset && editingAsset.id) {
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Asset Updated", description: `Asset ${data.asset_number} has been updated.` });
        fetchAssets();
      } else {
        toast({ title: "Error", description: result.message || "Failed to update asset." });
      }
    }
    setEditingAsset(null);
  };
  
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    switch (status.toLowerCase()) {
        case "in use": case "active": return "default";
        case "in store": case "reserved": return "secondary";
        case "under maintenance": case "calibration": return "outline";
        case "scrapped": return "destructive";
        default: return "secondary";
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({ title: `Exporting to ${format.toUpperCase()}...`, description: `Preparing asset list for ${format} export. This is a mock action.` });
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = {...prev};
      if (checked) {
        newSelected[id] = true;
      } else {
        delete newSelected[id];
      }
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedRows: Record<string, boolean> = {};
      assets.forEach(item => {
        if(item.id) newSelectedRows[item.id] = true;
      });
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows({});
    }
  };

  const handleBulkDelete = async () => {
    const promises = Object.keys(selectedRows).map(id => {
      if (selectedRows[id]) {
        return fetch(`/api/assets/${id}`, { method: 'DELETE' });
      }
      return null;
    }).filter(Boolean);

    await Promise.all(promises);

    toast({ title: "Assets Deleted", description: `${selectedCount} asset(s) have been deleted.` });
    setSelectedRows({});
    setIsDeleteConfirmationOpen(false);
    fetchAssets();
  };

  const isAllSelected = assets.length > 0 && assets.every(item => item.id && selectedRows[item.id]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Management"
        description="Search, filter, manage, and report on all registered assets."
        actions={
          <Button asChild>
            <Link href="/asset-management/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Add New Asset
            </Link>
          </Button>
        }
      />
      <Dialog open={!!editingAsset} onOpenChange={(isOpen) => {
        if (!isOpen) setEditingAsset(null);
      }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details: {editingAsset?.asset_number}</DialogTitle>
            <DialogDescription>View or edit details for this asset. Only admins can save changes.</DialogDescription>
          </DialogHeader>
          {/* <AssetManagementForm
            initialData={editingAsset}
            onSave={handleSave}
            onCancel={() => setEditingAsset(null)}
            isEditing={isUserAdmin}
          /> */}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Asset Image: {viewingAssetMedia?.asset_number}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-4">
                  <Image src="https://picsum.photos/seed/1/600/400" alt={viewingAssetMedia?.asset_description || "Asset Image"} width={600} height={400} className="rounded-md object-contain" />
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Asset History: {viewingAssetMedia?.asset_number}</DialogTitle>
              </DialogHeader>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                 <ul className="space-y-4">
                    <li className="flex gap-4">
                        <div className="font-semibold text-sm w-28 shrink-0">2024-07-15</div>
                        <div className="text-sm">Status changed to <Badge variant="outline">Calibration</Badge> by Admin. Reason: Annual calibration.</div>
                    </li>
                 </ul>
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Bulk Upload Assets</DialogTitle>
                <DialogDescription>Upload an Excel or CSV file to add multiple assets at once. Please ensure the file follows the required template.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <FileUpload onFileChange={() => {}} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleBulkUpload}>Upload and Process</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedCount} asset(s) from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete asset(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by Asset No, KM No, Description, Serial No..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {/* Filters would be populated from API calls */}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">{selectedCount} selected</p>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={selectedCount === 0}><FileSpreadsheet className="w-4 h-4 mr-2"/>Export Selected</Button>
            {isUserAdmin && <Button variant="destructive" size="sm" disabled={selectedCount === 0} onClick={() => setIsDeleteConfirmationOpen(true)}><Trash2 className="w-4 h-4 mr-2"/>Bulk Delete</Button>}
             {isUserAdmin && <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" /> Upload Excel
            </Button>}
          </div>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll}/></TableHead>
                  <TableHead>Asset No.</TableHead>
                  <TableHead>KM No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading assets...</TableCell>
                  </TableRow>
                ) : assets.map((asset) => (
                  <TableRow key={asset.id} data-state={selectedRows[asset.id!] ? 'selected' : 'unselected'}>
                    <TableCell><Checkbox checked={!!(asset.id && selectedRows[asset.id])} onCheckedChange={(checked) => asset.id && handleSelectRow(asset.id, !!checked)}/></TableCell>
                    <TableCell className="font-medium">{asset.asset_number}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.km_number}</TableCell>
                    <TableCell>{asset.asset_description}<p className="text-xs text-muted-foreground">{asset.brand_name} {asset.model_no}</p></TableCell>
                    <TableCell>{asset.department_name}</TableCell>
                    <TableCell>{asset.location_name}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(asset.asset_status_name)}>{asset.asset_status_name}</Badge></TableCell>
                    <TableCell>{asset.verified_on ? format(new Date(asset.verified_on), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="View Image" onClick={() => openImageDialog(asset)}>
                        <ImageIcon className="w-4 h-4 text-sky-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="View History" onClick={() => openHistoryDialog(asset)}>
                        <History className="w-4 h-4 text-amber-500" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(asset)}>
                        <Eye className="w-3 h-3 mr-1" /> View/Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Showing {assets.length} of {totalAssets} assets. Page {currentPage} of {totalPages}.</TableCaption>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4 mr-1"/>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next<ChevronsRight className="w-4 h-4 ml-1"/></Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

