// src/app/(app)/asset-transactions/audit/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Search, Camera, Save, Loader2, ChevronsLeft, ChevronsRight, AlertCircle, Edit, ListFilter } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";

const ITEMS_PER_PAGE = 10;

export default function VerificationAuditPage() {
  const [assets, setAssets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const { toast } = useToast();

  // Form state for the verification dialog
  const [verificationStatus, setVerificationStatus] = React.useState("Verified");
  const [usableCondition, setUsableCondition] = React.useState("Yes");
  const [workingCondition, setWorkingCondition] = React.useState("Working");
  const [comments, setComments] = React.useState("");
  const [photo, setPhoto] = React.useState<File | null>(null);

  const filteredAssets = React.useMemo(() => {
    let tempAssets = assets.filter(a => !filterStatus || a.verificationStatus === filterStatus);
    if (searchTerm) {
      tempAssets = tempAssets.filter(asset =>
        asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tempAssets;
  }, [assets, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleVerifyClick = (asset: AssetManagementFormData) => {
    setSelectedAsset(asset);
    // Pre-fill dialog form with current asset data
    setVerificationStatus(asset.verificationStatus || "Pending");
    setUsableCondition(asset.usableCondition || "Yes");
    setWorkingCondition(asset.workingConditionStatus || "Working");
    setComments(asset.comments || "");
    setPhoto(null);
  };

  const handleSaveVerification = () => {
    if (!selectedAsset) return;
    if (!photo) {
      toast({ title: "Photo Required", description: "A verification photo is mandatory.", variant: "destructive" });
      return;
    }
    
    setIsVerifying(true);
    setTimeout(() => {
      setAssets(prev => prev.map(a => 
        a.id === selectedAsset.id 
          ? { ...a, 
              verificationStatus: verificationStatus as any,
              usableCondition: usableCondition as any,
              workingConditionStatus: workingCondition as any,
              comments: comments,
              verifiedOn: new Date(), // Set current date as verified on
              // attachments: { ...a.attachments, photo: photo } // In a real app
            } 
          : a
      ));
      toast({ title: "Verification Saved", description: `Asset ${selectedAsset.assetNumber} has been updated.` });
      setSelectedAsset(null);
      setIsVerifying(false);
    }, 1000);
  };

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    if (status === "Verified") return "default";
    if (status === "Pending") return "secondary";
    if (status === "Discrepancy") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Verification & Audit"
        description="Conduct audits by searching for assets and updating their verification status with mandatory photo evidence."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="w-5 h-5 mr-2 text-primary"/>Filter Assets for Audit</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by Asset No. or Description..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Verification Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Discrepancy">Discrepancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedAssets.length > 0 ? (
            <>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset No.</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Current User</TableHead>
                      <TableHead>Verification Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                        <TableCell>{asset.assetDescription}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>{asset.currentUser}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(asset.verificationStatus)}>{asset.verificationStatus || "N/A"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleVerifyClick(asset)}>
                            <ShieldCheck className="w-3 h-3 mr-1" /> Verify
                          </Button>
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
            </>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No assets match your current search/filters.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAsset} onOpenChange={(isOpen) => !isOpen && setSelectedAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary"/>Verify Asset: {selectedAsset?.assetNumber}</DialogTitle>
            <DialogDescription>Update the verification and condition status for this asset. A photo is required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                  <SelectTrigger id="verificationStatus"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Verified">Verified</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Discrepancy">Discrepancy</SelectItem></SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="usableCondition">Usable Condition</Label>
              <Select value={usableCondition} onValueChange={setUsableCondition}>
                  <SelectTrigger id="usableCondition"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Partial">Partial</SelectItem></SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="workingCondition">Working Condition</Label>
              <Select value={workingCondition} onValueChange={setWorkingCondition}>
                  <SelectTrigger id="workingCondition"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Working">Working</SelectItem><SelectItem value="Not Working">Not Working</SelectItem><SelectItem value="Under Maintenance">Under Maintenance</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea id="comments" placeholder="Note any discrepancies or issues..." value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
            <div className="space-y-2">
               <Label htmlFor="photo" className="flex items-center"><Camera className="w-4 h-4 mr-2"/>Verification Photo (Mandatory)</Label>
               <FileUpload onFileChange={setPhoto} accept="image/*" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isVerifying}>Cancel</Button></DialogClose>
            <Button onClick={handleSaveVerification} disabled={isVerifying || !photo}>
              {isVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : <><Save className="w-4 h-4 mr-2"/>Save Verification</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
