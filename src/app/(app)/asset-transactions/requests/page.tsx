// src/app/(app)/asset-transactions/requests/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, PlusCircle, Check, X, Loader2, Eye, Search } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { AssetManagementFormData } from "@/lib/schemas";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";


type RequestStatus = "Pending" | "Approved" | "Rejected";

interface OwnershipRequestAsset {
  assetId: string;
  assetNumber: string;
  currentDepartment: string;
}

interface OwnershipRequest {
  id: string;
  assets: OwnershipRequestAsset[];
  toDepartment: string;
  reason: string;
  requestedBy: string;
  requestedOn: Date;
  status: RequestStatus;
}

export default function AssetRequestPage() {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  
  // State for new request dialog
  const [selectedAssets, setSelectedAssets] = React.useState<AssetManagementFormData[]>([]);
  const [assetSearchTerm, setAssetSearchTerm] = React.useState("");
  const [toDept, setToDept] = React.useState("");
  const [reason, setReason] = React.useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();

  const assetsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "assets"));
  }, [firestore]);
  const { data: allAssets, isLoading: isLoadingAssets } = useCollection<AssetManagementFormData>(assetsQuery);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null; // Wait for user to be authenticated
    return query(collection(firestore, "assetRequests"));
  }, [firestore, user]); // Add user as a dependency
  const { data: requests, isLoading: isLoadingRequests } = useCollection<OwnershipRequest>(requestsQuery);

  // Filter for available assets for the selection dialog
  const availableAssets = React.useMemo(() => 
    (allAssets || []).filter(asset => 
      (asset.assetNumber.toLowerCase().includes(assetSearchTerm.toLowerCase()) || 
       asset.assetDescription.toLowerCase().includes(assetSearchTerm.toLowerCase()))
    ), 
  [allAssets, assetSearchTerm]);
  
  const handleToggleAssetSelection = (asset: AssetManagementFormData) => {
    setSelectedAssets(prev => 
      prev.some(a => a.id === asset.id) 
        ? prev.filter(a => a.id !== asset.id)
        : [...prev, asset]
    );
  };

  const handleRequestSubmit = () => {
    if (selectedAssets.length === 0 || !toDept || !reason || !user || !firestore) {
        toast({ title: "Missing fields", description: "Please select at least one asset, a destination department, and provide a reason.", variant: "destructive" });
        return;
    }
    const newRequest = {
        assets: selectedAssets.map(asset => ({
            assetId: asset.id,
            assetNumber: asset.assetNumber,
            currentDepartment: asset.department
        })),
        toDepartment: toDept,
        reason,
        requestedBy: user.displayName || user.email,
        requestedOn: new Date(),
        status: "Pending",
    };
    
    const requestsCollection = collection(firestore, "assetRequests");
    addDocumentNonBlocking(requestsCollection, newRequest);

    toast({ title: "Request Submitted", description: `Request for ${selectedAssets.length} asset(s) has been sent for approval.` });
    
    // Reset state and close dialog
    setIsRequestDialogOpen(false);
    setSelectedAssets([]);
    setAssetSearchTerm("");
    setToDept("");
    setReason("");
  };

  const handleRequestAction = (requestId: string, action: "Approve" | "Reject") => {
    if(!firestore) return;
    const requestDocRef = doc(firestore, "assetRequests", requestId);
    updateDocumentNonBlocking(requestDocRef, { status: action === "Approve" ? "Approved" : "Rejected" });
    toast({ title: `Request ${action}d` });
  };
  
  const getStatusBadgeVariant = (status: RequestStatus) => {
    if (status === "Approved") return "default";
    if (status === "Rejected") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Requests & Approvals"
        description="Request ownership changes or special asset reassignments and manage their approval status."
        actions={
            <Button onClick={() => setIsRequestDialogOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" /> New Request
            </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Ownership Change Requests</CardTitle>
          <CardDescription>Track the status of all pending, approved, and rejected ownership change requests.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>From Dept.</TableHead>
                  <TableHead>To Dept.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRequests && <TableRow><TableCell colSpan={6} className="text-center">Loading requests...</TableCell></TableRow>}
                {requests?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.id.substring(0,7)}...</TableCell>
                    <TableCell>
                      {req.assets.length > 1 
                        ? `${req.assets.length} assets` 
                        : req.assets[0]?.assetNumber}
                    </TableCell>
                    <TableCell>{[...new Set(req.assets.map(a => a.currentDepartment))].join(', ')}</TableCell>
                    <TableCell>{req.toDepartment}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                        {req.status === "Pending" && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => handleRequestAction(req.id, "Approve")}><Check className="w-3 h-3 mr-1"/>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRequestAction(req.id, "Reject")}><X className="w-3 h-3 mr-1"/>Reject</Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm"><Eye className="w-3 h-3 mr-1"/>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{requests?.length || 0} request(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>

       <Dialog open={isRequestDialogOpen} onOpenChange={(isOpen) => {
           if (!isOpen) {
               setSelectedAssets([]);
               setAssetSearchTerm("");
               setToDept("");
               setReason("");
           }
           setIsRequestDialogOpen(isOpen);
       }}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>New Ownership/Assignment Request</DialogTitle>
                <DialogDescription>Select one or more assets to include in this request, then specify the destination and reason.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Asset Selection Pane */}
              <div className="space-y-4">
                <Label>1. Select Assets</Label>
                <div className="relative">
                  <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search available assets..." 
                    className="pl-10" 
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-64 border rounded-md">
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Asset No.</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Dept.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingAssets && <TableRow><TableCell colSpan={4} className="text-center">Loading assets...</TableCell></TableRow>}
                        {availableAssets.map(asset => (
                          <TableRow key={asset.id} 
                            data-state={selectedAssets.some(a => a.id === asset.id) ? 'selected' : ''}
                            onClick={() => handleToggleAssetSelection(asset)}
                            className="cursor-pointer"
                          >
                            <TableCell><Checkbox checked={selectedAssets.some(a => a.id === asset.id)} /></TableCell>
                            <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                            <TableCell>{asset.assetDescription}</TableCell>
                            <TableCell>{asset.department}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </ScrollArea>
              </div>

              {/* Request Details Pane */}
              <div className="space-y-4">
                <Label>2. Request Details</Label>
                <div className="p-4 border rounded-md space-y-4 bg-muted/20 min-h-[300px]">
                   <div className="space-y-2">
                      <Label htmlFor="toDept">To Department</Label>
                      <Select onValueChange={setToDept} value={toDept} disabled={selectedAssets.length === 0}>
                          <SelectTrigger id="toDept"><SelectValue placeholder="Select new department"/></SelectTrigger>
                          <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Request</Label>
                      <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide a justification for this transfer." disabled={selectedAssets.length === 0}/>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold">Selected Assets ({selectedAssets.length})</h4>
                    <ScrollArea className="h-28 mt-2 text-xs text-muted-foreground">
                      {selectedAssets.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {selectedAssets.map(asset => <li key={asset.id}>{asset.assetNumber}</li>)}
                        </ul>
                      ) : (
                        <p>No assets selected.</p>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleRequestSubmit} disabled={selectedAssets.length === 0 || !toDept || !reason}>Submit Request</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
