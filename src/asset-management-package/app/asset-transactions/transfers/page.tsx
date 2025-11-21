// src/app/(app)/asset-transactions/transfers/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Loader2, Truck, PlusCircle, Calendar as CalendarIcon, User, MessageSquare, MapPin } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { MOVEMENT_TYPES, STORE_LOCATIONS, REASON_CODES } from "@/lib/constants";

interface TransferLog {
  id: string;
  assetNumber: string;
  assetDescription: string;
  dcNumber: string;
  movementType: typeof MOVEMENT_TYPES[number];
  fromLocation: string;
  toLocation: string;
  dispatchedOn: Date;
  responsiblePerson: string;
}

const mockTransfers: TransferLog[] = [
    { id: "TRN-001", assetNumber: "KONE-RD-OSC-001", assetDescription: "Tektronix Oscilloscope", dcNumber: "DC20240731001", movementType: "Calibration", fromLocation: "ITEC", toLocation: "Calibration Lab", dispatchedOn: new Date(), responsiblePerson: "Praveen S." },
    { id: "TRN-002", assetNumber: "KONE-RD-LAP-001", assetDescription: "Dell Latitude 5420 Laptop", dcNumber: "DC20240730002", movementType: "ITEC -> Site", fromLocation: "ITEC", toLocation: "KONE Site Chennai", dispatchedOn: new Date(new Date().setDate(new Date().getDate() - 1)), responsiblePerson: "Nagaraj V." },
];


export default function TransferPage() {
  const [transfers, setTransfers] = React.useState<TransferLog[]>(mockTransfers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [movementType, setMovementType] = React.useState<typeof MOVEMENT_TYPES[number] | "">("");
  const [toLocation, setToLocation] = React.useState("");
  const [dcNumber, setDcNumber] = React.useState("");
  const [dispatchDate, setDispatchDate] = React.useState<Date | undefined>(new Date());
  const [responsiblePerson, setResponsiblePerson] = React.useState("");
  const [reason, setReason] = React.useState<typeof REASON_CODES[number] | "">("");
  
  const { toast } = useToast();
  
  const filteredAssets = mockAssetData.filter(asset => 
    !asset.currentStatus || !['Calibration', 'Scrapped'].includes(asset.currentStatus)
  ).filter(asset => 
    asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.assetDescription.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0,5);

  const handleOpenTransferDialog = (asset: AssetManagementFormData) => {
    setSelectedAsset(asset);
    setIsTransferDialogOpen(true);
    // Reset form
    setMovementType("");
    setToLocation("");
    setDcNumber("");
    setDispatchDate(new Date());
    setResponsiblePerson("");
    setReason("");
  };

  const handleTransferSubmit = () => {
    if (!selectedAsset || !movementType || !toLocation || !dcNumber || !dispatchDate || !responsiblePerson || !reason) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
        const newTransfer: TransferLog = {
            id: `TRN-${String(Date.now()).slice(-4)}`,
            assetNumber: selectedAsset.assetNumber,
            assetDescription: selectedAsset.assetDescription,
            dcNumber,
            movementType,
            fromLocation: selectedAsset.location,
            toLocation,
            dispatchedOn: dispatchDate,
            responsiblePerson,
        };
        setTransfers(prev => [newTransfer, ...prev]);
        toast({ title: "Transfer Initiated", description: `Asset ${selectedAsset.assetNumber} is now in transit.` });
        setIsTransferDialogOpen(false);
        setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Transfer (Movement)"
        description="Execute asset transfers between locations, for calibration, or for scrap."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Initiate New Transfer</CardTitle>
              <CardDescription>Search for an asset to start a new movement.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-2">
                <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by asset number or name..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                 {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                    <div key={asset.id} className="p-3 border-b last:border-b-0">
                        <p className="font-medium text-sm">{asset.assetNumber}</p>
                        <p className="text-xs text-muted-foreground">{asset.assetDescription}</p>
                        <Button size="sm" variant="outline" className="mt-2 h-7 px-2 py-1 text-xs" onClick={() => handleOpenTransferDialog(asset)}>
                            <Truck className="w-3 h-3 mr-1.5"/>Initiate Transfer
                        </Button>
                    </div>
                )) : <p className="p-4 text-center text-sm text-muted-foreground">No available assets found.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Truck className="w-5 h-5 mr-2 text-primary"/>Recent Movement Logs</CardTitle>
                    <CardDescription>Log of all recent asset movements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Asset No.</TableHead><TableHead>Movement</TableHead><TableHead>From → To</TableHead><TableHead>DC No.</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {transfers.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.assetNumber}</TableCell>
                                    <TableCell><Badge variant="secondary">{t.movementType}</Badge></TableCell>
                                    <TableCell>{t.fromLocation} → {t.toLocation}</TableCell>
                                    <TableCell>{t.dcNumber}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
      
       <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Transfer Asset: {selectedAsset?.assetNumber}</DialogTitle>
                <DialogDescription>Asset is currently at: <strong>{selectedAsset?.location}</strong></DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="movementType" className="text-right">Movement Type</Label>
                    <Select onValueChange={(v) => setMovementType(v as any)} value={movementType}><SelectTrigger id="movementType" className="col-span-3"><SelectValue/></SelectTrigger><SelectContent>{MOVEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="toLocation" className="text-right"><MapPin className="inline w-3 h-3 mr-1"/>To Location</Label>
                    <Select onValueChange={setToLocation} value={toLocation}><SelectTrigger id="toLocation" className="col-span-3"><SelectValue/></SelectTrigger><SelectContent>{STORE_LOCATIONS.filter(l => l !== selectedAsset?.location).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dcNumber" className="text-right">DC Number</Label>
                    <Input id="dcNumber" value={dcNumber} onChange={e => setDcNumber(e.target.value)} className="col-span-3"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dispatchDate" className="text-right"><CalendarIcon className="inline w-3 h-3 mr-1"/>Dispatch Date</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!dispatchDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dispatchDate ? format(dispatchDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dispatchDate} onSelect={setDispatchDate} initialFocus /></PopoverContent></Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsiblePerson" className="text-right"><User className="inline w-3 h-3 mr-1"/>Responsible</Label>
                    <Input id="responsiblePerson" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} className="col-span-3"/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">Reason</Label>
                    <Select onValueChange={(v) => setReason(v as any)} value={reason}><SelectTrigger id="reason" className="col-span-3"><SelectValue/></SelectTrigger><SelectContent>{REASON_CODES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleTransferSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Submitting...</> : <><Send className="w-4 h-4 mr-2"/>Execute Transfer</>}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
