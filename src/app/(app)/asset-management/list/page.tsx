// src/app/(app)/asset-management/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Search, ChevronsLeft, ChevronsRight, Upload, ListFilter, FileSpreadsheet, FileText, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, ASSET_CLASSIFICATIONS, ASSET_STATUSES, STORE_LOCATIONS } from "@/lib/constants";
import { mockAssetData } from "@/lib/mock-asset-data";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import type { AssetManagementFormData } from "@/lib/schemas";
import { FileUpload } from "@/components/ui/file-upload";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 10;

export default function AssetListPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assets, setAssets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  const [editingAsset, setEditingAsset] = React.useState<AssetManagementFormData | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({});

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterDepartment, setFilterDepartment] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [filterClassification, setFilterClassification] = React.useState("");
  const [filterLocation, setFilterLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const isUserAdmin = user?.role === 'admin';

  const filteredAssets = React.useMemo(() => {
    let tempAssets = [...assets];
    
    // Role-based filtering
    if (user?.role === 'spoc' && user.department) {
      tempAssets = tempAssets.filter(asset => asset.department === user.department);
    } else if (user?.role === 'user' && user.department) {
      tempAssets = tempAssets.filter(asset => asset.department === user.department);
    }

    // UI Filters
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
  }, [assets, searchTerm, filterDepartment, filterStatus, filterClassification, filterLocation, user]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openEditDialog = (asset: AssetManagementFormData) => {
    setEditingAsset(asset);
  };
  
  const handleBulkUpload = () => {
    toast({
      title: "File uploaded successfully!",
      description: "Asset data will be processed. This is a mock action.",
    });
    setIsUploadDialogOpen(false);
  }

  const handleSave = (data: AssetManagementFormData) => {
    if (editingAsset) {
      setAssets(prev => prev.map(a => (a.id === editingAsset.id ? { ...a, ...data } : a)));
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
    setSelectedRows(prev => ({ ...prev, [id]: checked }));
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      paginatedAssets.forEach(item => {
        if(item.id) newSelectedRows[item.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };

  const isAllSelected = paginatedAssets.length > 0 && paginatedAssets.every(item => item.id && selectedRows[item.id]);
  const isSomeSelected = Object.values(selectedRows).some(val => val);


  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Register"
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
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
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
            <p className="text-sm text-muted-foreground">{Object.keys(selectedRows).filter(k => selectedRows[k]).length} selected</p>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={!isSomeSelected}><FileSpreadsheet className="w-4 h-4 mr-2"/>Export Selected</Button>
            {isUserAdmin && <Button variant="destructive" size="sm" disabled={!isSomeSelected}><Trash2 className="w-4 h-4 mr-2"/>Bulk Delete</Button>}
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
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell><Checkbox checked={!!(asset.id && selectedRows[asset.id])} onCheckedChange={(checked) => asset.id && handleSelectRow(asset.id, !!checked)}/></TableCell>
                    <TableCell className="font-medium">
                      {asset.assetNumber}
                      <p className="text-xs text-muted-foreground">{asset.kmNumber}</p>
                    </TableCell>
                    <TableCell>{asset.assetDescription}<p className="text-xs text-muted-foreground">{asset.brandName} {asset.modelNo}</p></TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(asset.currentStatus)}>{asset.currentStatus}</Badge></TableCell>
                    <TableCell>{asset.verifiedOn ? format(new Date(asset.verifiedOn), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell className="text-right">
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
