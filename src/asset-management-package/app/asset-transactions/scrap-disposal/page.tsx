// src/app/(app)/asset-transactions/scrap-disposal/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Recycle, Search, Send, File, Hash, Calendar as CalendarIcon, Save, Loader2 } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function ScrapDisposalPage() {
  const [assets, setAssets] = React.useState<AssetManagementFormData[]>(mockAssetData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [scrapDcNo, setScrapDcNo] = React.useState("");
  const [scrapDcDate, setScrapDcDate] = React.useState<Date | undefined>(new Date());
  const [reason, setReason] = React.useState("");
  const [disposalProof, setDisposalProof] = React.useState<File | null>(null);

  const { toast } = useToast();

  const handleOpenScrapDialog = (asset: AssetManagementFormData) => {
    if (asset.currentStatus === "Scrapped") {
      toast({ title: "Asset already scrapped", variant: "destructive" });
      return;
    }
    setSelectedAsset(asset);
  };

  const handleScrapSubmit = () => {
    if (!selectedAsset || !scrapDcNo || !scrapDcDate || !reason || !disposalProof) {
        toast({ title: "All fields are mandatory", description: "Please provide all details including the disposal proof.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
        setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, currentStatus: "Scrapped" } : a));
        toast({ title: "Asset Scrapped Successfully", description: `Asset ${selectedAsset.assetNumber} has been marked as scrapped.` });
        setSelectedAsset(null);
        setIsSubmitting(false);
    }, 1500);
  };

  const filteredAssets = mockAssetData.filter(asset => 
    asset.currentStatus !== "Scrapped" &&
    (asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.assetDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Disposal"
        description="Execute the final disposal of an asset. This action is irreversible and locks the asset from further use."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Select an Asset to Scrap</CardTitle>
           <div className="relative mt-4">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search available assets by number or description..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="h-72 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Asset No.</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredAssets.map(asset => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                      <TableCell>{asset.assetDescription}</TableCell>
                      <TableCell><Badge variant="outline">{asset.currentStatus}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleOpenScrapDialog(asset)}><Recycle className="w-3 h-3 mr-1" />Scrap</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
      
       <Dialog open={!!selectedAsset} onOpenChange={(isOpen) => !isOpen && setSelectedAsset(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center text-destructive"><Recycle className="w-5 h-5 mr-2"/>Scrap Asset: {selectedAsset?.assetNumber}</DialogTitle>
                <DialogDescription>Enter the Scrap DC details. This will permanently mark the asset as scrapped and lock it from any further transactions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scrapDcNo" className="text-right"><Hash className="inline w-3 h-3 mr-1"/>Scrap DC No.</Label>
                    <Input id="scrapDcNo" value={scrapDcNo} onChange={e => setScrapDcNo(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scrapDcDate" className="text-right"><CalendarIcon className="inline w-3 h-3 mr-1"/>Scrap DC Date</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!scrapDcDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{scrapDcDate ? format(scrapDcDate, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={scrapDcDate} onSelect={setScrapDcDate} initialFocus /></PopoverContent></Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">Reason</Label>
                    <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} className="col-span-3" placeholder="Reason for scrapping..."/>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="disposalProof" className="text-right"><File className="inline w-3 h-3 mr-1"/>Disposal Proof</Label>
                    <div className="col-span-3"><FileUpload onFileChange={setDisposalProof} /></div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button onClick={handleScrapSubmit} variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Scrapping...</> : <>Confirm Scrap</>}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
