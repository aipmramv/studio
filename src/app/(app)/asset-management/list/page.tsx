
// src/app/(app)/asset-management/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Search, LibraryBig, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";
import { mockAssetData } from "@/lib/mock-asset-data";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import type { AssetManagementFormData } from "@/lib/schemas";

const ITEMS_PER_PAGE = 10;

export default function AssetListPage() {
  const { toast } = useToast();
  const [assets, setAssets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<AssetManagementFormData | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterDepartment, setFilterDepartment] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const distinctStatuses = React.useMemo(() => Array.from(new Set(assets.map(a => a.currentStatus).filter(Boolean))), [assets]);

  const filteredAssets = React.useMemo(() => {
    let tempAssets = [...assets];
    if (filterDepartment) {
      tempAssets = tempAssets.filter(asset => asset.department === filterDepartment);
    }
    if (filterStatus) {
      tempAssets = tempAssets.filter(asset => asset.currentStatus === filterStatus);
    }
    if (searchTerm) {
      tempAssets = tempAssets.filter(asset =>
        asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.materialCode && asset.materialCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.productSerialNo && asset.productSerialNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return tempAssets;
  }, [assets, searchTerm, filterDepartment, filterStatus]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAddDialog = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (asset: AssetManagementFormData) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleSave = (data: AssetManagementFormData) => {
    if (editingAsset) {
      setAssets(prev => prev.map(a => (a.id === editingAsset.id ? { ...a, ...data } : a)));
      toast({ title: "Asset Updated", description: `Asset ${data.assetNumber} has been updated.` });
    } else {
      const newAsset: AssetManagementFormData = { ...data, id: `ASSET-${Date.now()}` };
      setAssets(prev => [newAsset, ...prev]);
      toast({ title: "Asset Added", description: `New asset ${data.assetNumber} has been added.` });
    }
    setIsFormOpen(false);
  };
  
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    switch (status.toLowerCase()) {
        case "in use": return "default";
        case "in store": return "secondary";
        case "under maintenance": return "destructive";
        case "scrapped": return "outline";
        default: return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Management System"
        description="Manage, track, and verify all company assets."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Asset
          </Button>
        }
      />
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) setEditingAsset(null);
      }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit" : "Add New"} Asset</DialogTitle>
            <DialogDescription>{editingAsset ? `Update details for asset ${editingAsset.assetNumber}` : "Fill in the details for the new asset."}</DialogDescription>
          </DialogHeader>
          <AssetManagementForm
            initialData={editingAsset}
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><LibraryBig className="w-5 h-5 mr-2 text-primary" /> Asset List</CardTitle>
          <CardDescription>A complete list of all registered assets. Use filters to narrow down results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by Asset No, Description, Serial No..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
             <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {distinctStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetDescription}<p className="text-xs text-muted-foreground">{asset.brandName} {asset.modelNo}</p></TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(asset.currentStatus)}>{asset.currentStatus}</Badge></TableCell>
                    <TableCell>{asset.verifiedOn ? format(new Date(asset.verifiedOn), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(asset)}>
                        <Edit className="w-3 h-3 mr-1" /> View/Edit
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
