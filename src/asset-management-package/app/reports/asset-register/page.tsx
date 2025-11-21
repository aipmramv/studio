// src/app/(app)/reports/asset-register/page.tsx
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
import { FileText, Search, ChevronsLeft, ChevronsRight, FileSpreadsheet, ListFilter, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, ASSET_STATUSES, ASSET_CLASSIFICATIONS, STORE_LOCATIONS } from "@/lib/constants";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { AssetManagementForm } from "@/components/forms/AssetForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

export default function AssetRegisterReportPage() {
  const { toast } = useToast();
  const [assets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  
  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterDepartment, setFilterDepartment] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("");
  const [filterLocation, setFilterLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewingAsset, setViewingAsset] = React.useState<AssetManagementFormData | null>(null);

  const filteredAssets = React.useMemo(() => {
    let tempAssets = [...assets];
    if (filterDepartment) tempAssets = tempAssets.filter(asset => asset.department === filterDepartment);
    if (filterStatus) tempAssets = tempAssets.filter(asset => asset.currentStatus === filterStatus);
    if (filterCategory) tempAssets = tempAssets.filter(asset => asset.assetClassification === filterCategory);
    if (filterLocation) tempAssets = tempAssets.filter(asset => asset.location === filterLocation);
    if (searchTerm) {
      tempAssets = tempAssets.filter(asset =>
        Object.values(asset).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    return tempAssets;
  }, [assets, searchTerm, filterDepartment, filterStatus, filterCategory, filterLocation]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing asset register for ${format} export. This is a mock action.`,
    });
  };

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Register Report"
        description="A complete, filterable list of all assets with key fields."
         actions={
          <>
            <Button variant="outline" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </>
        }
      />
      
      <Dialog open={!!viewingAsset} onOpenChange={(isOpen) => !isOpen && setViewingAsset(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader><DialogTitle>Asset Details: {viewingAsset?.assetNumber}</DialogTitle></DialogHeader>
          <AssetManagementForm initialData={viewingAsset} onSave={() => {}} onCancel={() => setViewingAsset(null)} isEditing/>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="w-5 h-5 mr-2 text-primary" /> Filters</CardTitle>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Departments</SelectItem>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={(value) => setFilterLocation(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Locations</SelectItem>{STORE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
            </Select>
             <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{ASSET_CLASSIFICATIONS.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
             <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem>{ASSET_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative flex-grow mb-6">
            <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search across all fields..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset No.</TableHead>
                  <TableHead>KM No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capitalization Date</TableHead>
                  <TableHead>EOL Date</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      {asset.assetNumber}
                    </TableCell>
                    <TableCell>{asset.kmNumber}</TableCell>
                    <TableCell>{asset.assetDescription}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell><Badge variant="outline">{asset.currentStatus}</Badge></TableCell>
                    <TableCell>{asset.capitalizationDate ? format(new Date(asset.capitalizationDate), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell>{asset.eolDate ? format(new Date(asset.eolDate), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell>{currencyFormatter.format(asset.purchaseValue || 0)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => setViewingAsset(asset)}><Eye className="w-4 h-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Showing {paginatedAssets.length} of {filteredAssets.length} assets.</TableCaption>
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
