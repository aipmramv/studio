
// src/components/features/DeliveryNoteGeneratorContent.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Printer, FileText, AlertCircle, ExternalLink, Send, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MaterialItem {
  sno: number;
  description: string;
  quantity: number;
  uom: string; // Unit of Measurement
  value: number;
}

interface DeliveryNoteData {
  deliveryNoteNumber: string;
  date: string;
  vehicleNumber: string;
  approvedRequestID: string;
  source: string;
  destination: string;
  materials: MaterialItem[];
  eWayBillLink?: string;
}

const mockDeliveryNoteData: DeliveryNoteData = {
  deliveryNoteNumber: "DN20240730001",
  date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
  vehicleNumber: "MH01XY1234",
  approvedRequestID: "MM001",
  source: "Production Warehouse A",
  destination: "Client Site X",
  materials: [
    { sno: 1, description: "Steel Beams Grade A (10m)", quantity: 10, uom: "Pieces", value: 120000 },
    { sno: 2, description: "Fasteners Kit Type B", quantity: 50, uom: "Kits", value: 30000 },
  ],
  eWayBillLink: "https://ewaybillgst.gov.in/mock-link/12345"
};

export function DeliveryNoteGeneratorContent() {
  const [deliveryNoteData, setDeliveryNoteData] = React.useState<DeliveryNoteData>(mockDeliveryNoteData);
  const [eWayBillRef, setEWayBillRef] = React.useState(deliveryNoteData.eWayBillLink || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const currentTime = new Date();
  const submissionDeadline = new Date(currentTime);
  submissionDeadline.setHours(15, 30, 0, 0); // 3:30 PM
  const canSubmit = currentTime < submissionDeadline;

  const totalValue = deliveryNoteData.materials.reduce((sum, item) => sum + item.value, 0);
  const formattingOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const handleSubmitDeliveryNote = () => {
    if (!canSubmit) {
      toast({
        title: "Submission Deadline Missed",
        description: "Delivery Notes must be submitted before 3:30 PM.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    console.log("Submitting Delivery Note:", { ...deliveryNoteData, eWayBillLink: eWayBillRef });
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Delivery Note Submitted Successfully",
        description: `Delivery Note ${deliveryNoteData.deliveryNoteNumber} has been finalized.`,
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handlePreviewPdf = () => {
    toast({
      title: "PDF Preview",
      description: "Generating PDF preview... (This is a mock action)",
    });
    window.print();
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="flex items-center text-2xl font-headline">
              <FileText className="w-6 h-6 mr-2 text-primary" /> Delivery Note
            </CardTitle>
            <CardDescription>Review and finalize the auto-generated Delivery Note.</CardDescription>
          </div>
           <Button onClick={handlePreviewPdf} variant="outline">
            <Printer className="w-4 h-4 mr-2" /> Preview/Print PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canSubmit && (
          <div className="p-4 mb-4 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            The deadline for Delivery Note submission (3:30 PM) has passed for today.
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg md:grid-cols-3 bg-card">
          <div><strong>Note Number:</strong> {deliveryNoteData.deliveryNoteNumber}</div>
          <div><strong>Date:</strong> {deliveryNoteData.date}</div>
          <div><strong>Vehicle No:</strong> {deliveryNoteData.vehicleNumber}</div>
          <div><strong>Source:</strong> {deliveryNoteData.source}</div>
          <div><strong>Destination:</strong> {deliveryNoteData.destination}</div>
          <div><strong>Approved Request ID:</strong> {deliveryNoteData.approvedRequestID}</div>
        </div>

        <div>
          <Label htmlFor="ewaybill" className="text-base font-medium">E-Way Bill Reference</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="ewaybill"
              placeholder="Enter E-Way Bill Number or Link"
              value={eWayBillRef}
              onChange={(e) => setEWayBillRef(e.target.value)}
              className="flex-grow"
            />
            {eWayBillRef && eWayBillRef.startsWith("http") && (
              <Button variant="outline" size="icon" asChild>
                <a href={eWayBillRef} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground">Material List</h3>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S.No.</TableHead>
                <TableHead>Description of Goods</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryNoteData.materials.map((item) => (
                <TableRow key={item.sno}>
                  <TableCell>{item.sno}</TableCell>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell className="text-right">{item.value.toLocaleString('en-IN', formattingOptions)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
             <TableCaption className="p-2 text-right bg-muted/50">
              <strong>Total Value: {totalValue.toLocaleString('en-IN', formattingOptions)}</strong>
            </TableCaption>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 md:flex-row md:justify-end">
         <p className="text-sm text-muted-foreground md:mr-auto">
            Ensure all details are correct before submission.
          </p>
        <Button
          onClick={handleSubmitDeliveryNote}
          disabled={!canSubmit || isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Delivery Note</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
