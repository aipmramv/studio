// src/app/(app)/asset-transactions/requests/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, PlusCircle, Check, X, Loader2, Eye } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import { DEPARTMENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { AssetManagementFormData } from "@/lib/schemas";

type RequestStatus = "Pending" | "Approved" | "Rejected";
interface OwnershipRequest {
  id: string;
  assetNumber: string;
  assetDescription: string;
  currentDepartment: string;
  requestedDepartment: string;
  reason: string;
  requestedBy: string;
  requestedOn: Date;
  status: RequestStatus;
}

const mockRequests: OwnershipRequest[] = [
    { id: "REQ-001", assetNumber: "KONE-RD-OSC-001", assetDescription: "Tektronix Oscilloscope", currentDepartment: "R&D", requestedDepartment: "Maintenance", reason: "Required for new diagnostics bench.", requestedBy: "Praveen S.", requestedOn: new Date(), status: "Pending" },
    { id: "REQ-002", assetNumber: "KONE-RD-LAP-001", assetDescription: "Dell Latitude 5420 Laptop", currentDepartment: "R&D", requestedDepartment: "IT", reason: "Standardizing IT-managed assets.", requestedBy: "Admin Ram", requestedOn: new Date(new Date().setDate(new Date().getDate() - 2)), status: "Approved" },
];

export default function AssetRequestPage() {
  const [requests, setRequests] = React.useState<OwnershipRequest[]>(mockRequests);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);
  
  // Form state
  const [toDept, setToDept] = React.useState("");
  const [reason, setReason] = React.useState("");
  
  const { toast } = useToast();

  const handleOpenRequestDialog = (asset: AssetManagementFormData) => {
    setSelectedAsset(asset);
    setIsRequestDialogOpen(true);
  };

  const handleRequestSubmit = () => {
    if (!selectedAsset || !toDept || !reason) {
        toast({ title: "Missing fields", description: "Please select a department and provide a reason.", variant: "destructive" });
        return;
    }
    const newRequest: OwnershipRequest = {
        id: `REQ-${String(Date.now()).slice(-4)}`,
        assetNumber: selectedAsset.assetNumber,
        assetDescription: selectedAsset.assetDescription,
        currentDepartment: selectedAsset.department,
        requestedDepartment: toDept,
        reason,
        requestedBy: "Current User", // Mock
        requestedOn: new Date(),
        status: "Pending",
    };
    setRequests(prev => [newRequest, ...prev]);
    toast({ title: "Request Submitted", description: `Request for ${selectedAsset.assetNumber} has been sent for approval.` });
    setIsRequestDialogOpen(false);
  };

  const handleRequestAction = (requestId: string, action: "Approve" | "Reject") => {
    setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: action === "Approve" ? "Approved" : "Rejected" } : req
    ));
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
            <Button onClick={() => handleOpenRequestDialog(mockAssetData[0])}> {/* Mock opening with first asset */}
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
                  <TableHead>Asset No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>From Dept.</TableHead>
                  <TableHead>To Dept.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.assetNumber}</TableCell>
                    <TableCell>{req.assetDescription}</TableCell>
                    <TableCell>{req.currentDepartment}</TableCell>
                    <TableCell>{req.requestedDepartment}</TableCell>
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
              <TableCaption>{requests.length} request(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>

       <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>New Ownership Request for: {selectedAsset?.assetNumber}</DialogTitle>
                <DialogDescription>Request to transfer ownership of this asset to another department.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fromDept" className="text-right">From Dept.</Label>
                    <Input id="fromDept" value={selectedAsset?.department} disabled className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="toDept" className="text-right">To Dept.</Label>
                    <Select onValueChange={setToDept} value={toDept}><SelectTrigger id="toDept" className="col-span-3"><SelectValue placeholder="Select new department"/></SelectTrigger>
                        <SelectContent>{DEPARTMENTS.filter(d => d !== selectedAsset?.department).map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">Reason</Label>
                    <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} className="col-span-3" placeholder="Provide a justification for this transfer."/>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleRequestSubmit} disabled={!toDept || !reason}>Submit Request</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
