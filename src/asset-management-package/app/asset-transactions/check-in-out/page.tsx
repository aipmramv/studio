// src/app/(app)/asset-transactions/check-in-out/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Search, PlusCircle, Calendar as CalendarIcon, User, MessageSquare } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CheckedOutAsset extends AssetManagementFormData {
  checkedOutOn: Date;
  expectedReturnDate: Date;
}

const initialCheckedOut: CheckedOutAsset[] = mockAssetData.slice(0, 2).map((asset, i) => ({
  ...asset,
  currentUser: i === 0 ? "Praveen S." : "Nagaraj V.",
  checkedOutOn: new Date(new Date().setDate(new Date().getDate() - (i + 1) * 3)),
  expectedReturnDate: new Date(new Date().setDate(new Date().getDate() + 7 - (i + 1) * 3)),
}));

export default function CheckInOutPage() {
  const [assets, setAssets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  const [checkedOutAssets, setCheckedOutAssets] = React.useState<CheckedOutAsset[]>(initialCheckedOut);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);

  // Check-out form state
  const [custodian, setCustodian] = React.useState("");
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 7)));
  const [remarks, setRemarks] = React.useState("");
  
  const { toast } = useToast();

  const handleOpenCheckOutDialog = (asset: AssetManagementFormData) => {
    if(checkedOutAssets.some(a => a.id === asset.id)){
      toast({title: "Asset Already Checked Out", variant: "destructive"});
      return;
    }
    setSelectedAsset(asset);
    setIsCheckOutDialogOpen(true);
    // Reset form
    setCustodian("");
    setReturnDate(new Date(new Date().setDate(new Date().getDate() + 7)));
    setRemarks("");
  };

  const handleCheckOut = () => {
    if (!selectedAsset || !custodian || !returnDate) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setCheckedOutAssets(prev => [...prev, { ...selectedAsset, currentUser: custodian, checkedOutOn: new Date(), expectedReturnDate: returnDate }]);
    toast({ title: "Asset Checked Out", description: `${selectedAsset.assetNumber} assigned to ${custodian}.` });
    setIsCheckOutDialogOpen(false);
  };

  const handleCheckIn = (assetId: string) => {
    const asset = checkedOutAssets.find(a => a.id === assetId);
    setCheckedOutAssets(prev => prev.filter(a => a.id !== assetId));
    toast({ title: "Asset Checked In", description: `${asset?.assetNumber} is now available.` });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Check-in / Check-out"
        description="Manage temporary assignment of assets to users and track return dates."
      />

      <Card>
        <CardHeader>
          <CardTitle>Currently Checked-out Assets</CardTitle>
          <CardDescription>This list shows all assets currently assigned to users. Return reminders are sent 3 days before the due date.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Asset No.</TableHead><TableHead>Description</TableHead><TableHead>Current User</TableHead><TableHead>Return Due</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {checkedOutAssets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                  <TableCell>{asset.assetDescription}</TableCell>
                  <TableCell>{asset.currentUser}</TableCell>
                  <TableCell>{format(asset.expectedReturnDate, "dd-MMM-yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleCheckIn(asset.id)}><LogIn className="w-3 h-3 mr-1" />Check-in</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>{checkedOutAssets.length} asset(s) currently checked out.</TableCaption>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Check-out an Asset</CardTitle>
          <CardDescription>Search for an available asset to check it out to a user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search available assets by number or description..." className="pl-10" />
            </div>
            <div className="h-64 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Asset No.</TableHead><TableHead>Description</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.filter(a => !checkedOutAssets.some(coa => coa.id === a.id)).slice(0, 10).map(asset => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                      <TableCell>{asset.assetDescription}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="default" size="sm" onClick={() => handleOpenCheckOutDialog(asset)}><LogOut className="w-3 h-3 mr-1" />Check-out</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Check-out: {selectedAsset?.assetNumber}</DialogTitle>
                <DialogDescription>{selectedAsset?.assetDescription}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="custodian" className="text-right flex items-center gap-1"><User className="w-3 h-3"/>Custodian</Label>
                    <Input id="custodian" value={custodian} onChange={e => setCustodian(e.target.value)} className="col-span-3" placeholder="Enter user/custodian name" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="returnDate" className="text-right flex items-center gap-1"><CalendarIcon className="w-3 h-3"/>Return Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!returnDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="remarks" className="text-right flex items-center gap-1"><MessageSquare className="w-3 h-3"/>Remarks</Label>
                    <Input id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} className="col-span-3" placeholder="Optional remarks"/>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCheckOut}>Confirm Check-out</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
