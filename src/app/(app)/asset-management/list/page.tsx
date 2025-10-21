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
import { DEPARTMENTS, ASSET_STATUSES, STORE_LOCATIONS, ASSET_CLASSIFICATIONS } from "@/lib/constants";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import type { AssetManagementFormData } from "@/lib/schemas";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";


const ITEMS_PER_PAGE = 10;

export default function AssetListPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [editingAsset, setEditingAsset] = React.useState<AssetManagementFormData | null>(null);
  const [viewingAssetMedia, setViewingAssetMedia] = React.useState<AssetManagementFormData | null>(null);
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

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    let q = collection(firestore, "assets");

    if (!isUserAdmin && user?.department) {
      return query(q, where("department", "==", user.department));
    }
    
    return query(q);
  }, [firestore, user, isUserAdmin]);

  const { data: allAssets, isLoading: isLoadingAssets } = useCollection<AssetManagementFormData>(assetsQuery);


  const filteredAssets = React.useMemo(() => {
    let tempAssets = allAssets || [];
    
    // Client-side filtering
    if (filterDepartment) tempAssets = tempAssets.filter(asset => asset.department === filterDepartment);
    if (filterStatus) tempAssets = tempAssets.filter(asset => asset.currentStatus === filterStatus);
    if (filterClassification) tempAssets = tempAssets.filter(asset => asset.assetClassification === filterClassification);
    if (filterLocation) tempAssets = tempAssets.filter(asset => asset.location === filterLocation);

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempAssets = tempAssets.filter(asset =>
        Object.values(asset).some(val => 
            String(val).toLowerCase().includes(lowercasedTerm)
        )
      );
    }
    return tempAssets;
  }, [allAssets, searchTerm, filterDepartment, filterStatus, filterClassification, filterLocation]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const selectedCount = Object.keys(selectedRows).filter(k => selectedRows[k]).length;


  const openEditDialog = (asset: AssetManagementFormData) => {
    setEditingAsset(asset);
  };

  const openImageDialog = (asset: AssetManagementFormData) => {
    setViewingAssetMedia(asset);
    setIsImageDialogOpen(true);
  };
  
  const openHistoryDialog = (asset: AssetManagementFormData) => {
    setViewingAssetMedia(asset);
    setIsHistoryDialogOpen(true);
  };

  const handleBulkUpload = () => {
    toast({
      title: "File uploaded successfully!",
      description: "Asset data will be processed. This is a mock action.",
    });
    setIsUploadDialogOpen(false);
  }

  const handleSave = (data: AssetManagementFormData) => {
    if (editingAsset && editingAsset.id && firestore) {
      const assetDocRef = doc(firestore, 'assets', editingAsset.id);
      updateDocumentNonBlocking(assetDocRef, data);
      toast({ title: "Asset Updated", description: `Asset ${data.assetNumber} has been updated.` });
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
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing asset list for ${format} export. This is a mock action.`,
    });
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
      paginatedAssets.forEach(item => {
        if(item.id) newSelectedRows[item.id] = true;
      });
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows({});
    }
  };

  const handleBulkDelete = () => {
    if (!firestore) return;
    Object.keys(selectedRows).forEach(id => {
      if (selectedRows[id]) {
        const docRef = doc(firestore, 'assets', id);
        deleteDocumentNonBlocking(docRef);
      }
    });
    toast({
      title: "Assets Deleted",
      description: `${selectedCount} asset(s) have been marked for deletion.`
    });
    setSelectedRows({});
    setIsDeleteConfirmationOpen(false);
  };


  const isAllSelected = paginatedAssets.length > 0 && paginatedAssets.every(item => item.id && selectedRows[item.id]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Management"
        description="Search, filter, manage, and report on all registered assets."
        actions={
          isUserAdmin && (
            <Button asChild>
              <Link href="/asset-management/new">
                <PlusCircle className="w-4 h-4 mr-2" /> Add New Asset
              </Link>
            </Button>
          )
        }
      />
      <Dialog open={!!editingAsset} onOpenChange={(isOpen) => {
        if (!isOpen) setEditingAsset(null);
      }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details: {editingAsset?.assetNumber}</DialogTitle>
            <DialogDescription>View or edit details for this asset. Only admins can save changes.</DialogDescription>
          </DialogHeader>
          <AssetManagementForm
            initialData={editingAsset}
            onSave={handleSave}
            onCancel={() => setEditingAsset(null)}
            isEditing={isUserAdmin}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Asset Image: {viewingAssetMedia?.assetNumber}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-4">
                  <Image src="https://picsum.photos/seed/1/600/400" alt={viewingAssetMedia?.assetDescription || "Asset Image"} width={600} height={400} className="rounded-md object-contain" />
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Asset History: {viewingAssetMedia?.assetNumber}</DialogTitle>
              </DialogHeader>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                 <ul className="space-y-4">
                    <li className="flex gap-4">
                        <div className="font-semibold text-sm w-28 shrink-0">2024-07-15</div>
                        <div className="text-sm">Status changed to <Badge variant="outline">Calibration</Badge> by Admin. Reason: Annual calibration.</div>
                    </li>
                     <li className="flex gap-4">
                        <div className="font-semibold text-sm w-28 shrink-0">2024-07-01</div>
                        <div className="text-sm">Asset Verified by Admin. Condition: Working.</div>
                    </li>
                     <li className="flex gap-4">
                        <div className="font-semibold text-sm w-28 shrink-0">2023-01-20</div>
                        <div className="text-sm">Checked out to <span className="font-semibold">Ram Kumar</span>. Expected return: 2023-02-20.</div>
                    </li>
                     <li className="flex gap-4">
                        <div className="font-semibold text-sm w-28 shrink-0">2022-01-15</div>
                        <div className="text-sm">Asset Created and registered by Admin. Status: <Badge variant="secondary">In Store</Badge>.</div>
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
            <Button variant="outline"><ListFilter className="w-4 h-4 mr-2"/> Filters</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)} disabled={!isUserAdmin}>
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Departments</SelectItem>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={(value) => setFilterLocation(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Locations</SelectItem>{STORE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterClassification} onValueChange={(value) => setFilterClassification(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Classifications" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Classifications</SelectItem>{ASSET_CLASSIFICATIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem>{ASSET_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
                {isLoadingAssets ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading assets...</TableCell>
                  </TableRow>
                ) : paginatedAssets.map((asset) => (
                  <TableRow key={asset.id} data-state={selectedRows[asset.id!] ? 'selected' : 'unselected'}>
                    <TableCell><Checkbox checked={!!(asset.id && selectedRows[asset.id])} onCheckedChange={(checked) => asset.id && handleSelectRow(asset.id, !!checked)}/></TableCell>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.kmNumber}</TableCell>
                    <TableCell>{asset.assetDescription}<p className="text-xs text-muted-foreground">{asset.brandName} {asset.modelNo}</p></TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(asset.currentStatus)}>{asset.currentStatus}</Badge></TableCell>
                    <TableCell>{asset.verifiedOn ? format(new Date(asset.verifiedOn), "dd-MMM-yyyy") : "N/A"}</TableCell>
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
              <TableCaption>Showing {paginatedAssets.length} of {filteredAssets.length} assets. Page {currentPage} of {totalPages}.</TableCaption>
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
