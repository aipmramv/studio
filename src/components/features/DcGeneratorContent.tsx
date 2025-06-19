
// src/components/features/DcGeneratorContent.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from "@/components/ui/table";
import { Printer, FileText, AlertCircle, ExternalLink, Send, Loader2, Search, CalendarDays, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


interface MaterialItem {
  sno: number;
  description: string;
  quantity: number;
  uom: string; // Unit of Measurement
  value: number;
}

interface DCDetails {
  dcNumber: string;
  approvedRequestID: string;
  approvedRequestType: 'Material Movement' | 'Sale Order';
  source: string;
  destination: string;
  materials: MaterialItem[];
}

// Mock data for selectable approved requests
const mockApprovedRequests: Array<{
  id: string;
  type: 'Material Movement' | 'Sale Order';
  source: string;
  destination: string;
  materials: MaterialItem[];
}> = [
  {
    id: "MM001", type: "Material Movement", source: "Central Warehouse", destination: "Production Line A",
    materials: [
      { sno: 1, description: "Steel Rods (6m)", quantity: 20, uom: "Pieces", value: 50000 },
      { sno: 2, description: "Connector Assemblies", quantity: 100, uom: "Units", value: 10000 },
    ]
  },
  {
    id: "SO005", type: "Sale Order", source: "Finished Goods Store", destination: "Client XYZ Corp",
    materials: [
      { sno: 1, description: "Product Model X (Assembled)", quantity: 5, uom: "Units", value: 250000 },
      { sno: 2, description: "Accessory Kit Alpha", quantity: 5, uom: "Kits", value: 15000 },
    ]
  },
  {
    id: "MM008", type: "Material Movement", source: "Warehouse B", destination: "Testing Lab",
    materials: [
      { sno: 1, description: "High-Purity Solvents", quantity: 2, uom: "Liters", value: 8000 },
    ]
  }
];


export function DcGeneratorContent() {
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | undefined>(undefined);
  const [dcDetails, setDcDetails] = React.useState<DCDetails | null>(null);
  const [dcDate, setDcDate] = React.useState<Date>(new Date());
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [eWayBillRef, setEWayBillRef] = React.useState("");

  const [isLoadingRequest, setIsLoadingRequest] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const currentTime = new Date();
  const submissionDeadline = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 15, 30, 0, 0); // Today 3:30 PM
  const canSubmit = currentTime < submissionDeadline;

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
    if (!requestId) {
      setDcDetails(null);
      setVehicleNumber("");
      setEWayBillRef("");
      setDcDate(new Date());
      return;
    }
    setIsLoadingRequest(true);
    // Simulate fetching data for the selected request
    setTimeout(() => {
      const request = mockApprovedRequests.find(r => r.id === requestId);
      if (request) {
        const now = new Date();
        const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newDcNumber = `DC${datePart}-${randomPart}`;

        setDcDetails({
          dcNumber: newDcNumber,
          approvedRequestID: request.id,
          approvedRequestType: request.type,
          source: request.source,
          destination: request.destination,
          materials: request.materials.map((m, index) => ({ ...m, sno: index + 1 })),
        });
        // Reset logistics fields for new DC
        setVehicleNumber("");
        setEWayBillRef("");
        setDcDate(new Date()); // Reset DC date to today
      } else {
        setDcDetails(null);
        toast({ title: "Error", description: "Could not load details for the selected request ID.", variant: "destructive" });
      }
      setIsLoadingRequest(false);
    }, 500);
  };

  const totalValue = dcDetails?.materials.reduce((sum, item) => sum + item.value, 0) || 0;
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const handleSubmitDc = () => {
    if (!dcDetails) {
      toast({ title: "No Request Selected", description: "Please select an approved request to generate a DC.", variant: "destructive" });
      return;
    }
    if (!vehicleNumber.trim()) {
        toast({ title: "Vehicle Number Required", description: "Please enter the vehicle number.", variant: "destructive" });
        return;
    }
    if (!canSubmit) {
      toast({
        title: "Submission Deadline Missed",
        description: "Delivery Challans must be submitted before 3:30 PM.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const finalDcData = {
      ...dcDetails,
      date: format(dcDate, "yyyy-MM-dd"),
      vehicleNumber: vehicleNumber,
      eWayBillLink: eWayBillRef,
      totalValue: totalValue,
    };
    console.log("Submitting DC:", finalDcData);

    setTimeout(() => {
      toast({
        title: "DC Submitted Successfully",
        description: `DC ${finalDcData.dcNumber} for Request ${finalDcData.approvedRequestID} has been finalized.`,
      });
      setIsSubmitting(false);
      // Reset after submission
      setSelectedRequestId(undefined); // This will clear the Select's displayed value
      setDcDetails(null);
      setVehicleNumber("");
      setEWayBillRef("");
      setDcDate(new Date());
    }, 1500);
  };

  const handlePreviewPdf = () => {
    if (!dcDetails) {
      toast({ title: "No DC Data", description: "Please select a request and fill logistics details to generate DC for preview.", variant: "destructive"});
      return;
    }
    toast({
      title: "PDF Preview",
      description: "Generating PDF preview... (This is a mock action)",
    });
    // In a real app, this would trigger a PDF generation library with `finalDcData`
    window.print();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="flex items-center text-2xl font-headline">
              <FileText className="w-6 h-6 mr-2 text-primary" /> Delivery Challan (DC)
            </CardTitle>
            <CardDescription>Select an approved request to auto-generate DC details, then fill in logistics information.</CardDescription>
          </div>
           <Button onClick={handlePreviewPdf} variant="outline" disabled={!dcDetails || isSubmitting}>
            <Printer className="w-4 h-4 mr-2" /> Preview/Print PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canSubmit && (
          <div className="p-4 mb-4 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            The deadline for DC submission (3:30 PM) has passed for today. New DCs cannot be submitted.
          </div>
        )}

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Search className="mr-2 h-5 w-5 text-primary"/>Select Source Request</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleRequestSelect} value={selectedRequestId} disabled={isLoadingRequest || isSubmitting}>
              <SelectTrigger className="w-full md:w-2/3 lg:w-1/2">
                <SelectValue placeholder="Select an approved Material Movement or Sale Order ID" />
              </SelectTrigger>
              <SelectContent>
                {mockApprovedRequests.map(req => (
                  <SelectItem key={req.id} value={req.id}>{req.id} ({req.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingRequest && <div className="flex items-center mt-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Loading request details...</div>}
          </CardContent>
        </Card>


        {dcDetails && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>DC Information (Auto-Generated)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <div><Label className="text-sm text-muted-foreground">DC Number:</Label> <p className="font-semibold text-foreground">{dcDetails.dcNumber}</p></div>
                  <div><Label className="text-sm text-muted-foreground">Source Request ID:</Label> <p className="text-foreground">{dcDetails.approvedRequestID} ({dcDetails.approvedRequestType})</p></div>
                  <div><Label className="text-sm text-muted-foreground">Source Location:</Label> <p className="text-foreground">{dcDetails.source}</p></div>
                  <div><Label className="text-sm text-muted-foreground">Destination Location:</Label> <p className="text-foreground">{dcDetails.destination}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><Truck className="mr-2 h-5 w-5 text-primary"/>Logistics Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="dcDate" className="flex items-center text-sm font-medium"><CalendarDays className="w-4 h-4 mr-1 text-muted-foreground"/>DC Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                            id="dcDate"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dcDate && "text-muted-foreground")}
                            disabled={isSubmitting}
                          >
                            <CalendarDays className="w-4 h-4 mr-2" />
                            {dcDate ? format(dcDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dcDate} onSelect={(date) => setDcDate(date || new Date())} initialFocus />
                      </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="vehicleNumber" className="text-sm font-medium">Vehicle Number (Mandatory)</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g., MH01XY1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                    className="border-input"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ewaybill" className="text-sm font-medium">E-Way Bill Reference/Number (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ewaybill"
                      placeholder="Enter E-Way Bill Number or Link"
                      value={eWayBillRef}
                      onChange={(e) => setEWayBillRef(e.target.value)}
                      className="flex-grow border-input"
                      disabled={isSubmitting}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                 <CardTitle className="text-lg flex items-center"><Truck className="mr-2 h-5 w-5 text-primary"/>Material List (Value in INR)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
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
                      {dcDetails.materials.map((item) => (
                        <TableRow key={item.sno}>
                          <TableCell>{item.sno}</TableCell>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.uom}</TableCell>
                          <TableCell className="text-right">{item.value.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4} className="text-right font-semibold">Total Value</TableCell>
                            <TableCell className="text-right font-semibold">{totalValue.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                        </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {selectedRequestId && !dcDetails && !isLoadingRequest && (
             <Card className="mt-4"><CardContent className="p-6 text-center text-destructive">Could not load details for selected request ID: {selectedRequestId}. Please try another.</CardContent></Card>
        )}

      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 md:flex-row md:justify-end pt-6 border-t mt-6">
         <p className="text-sm text-muted-foreground md:mr-auto">
            Submission cut-off is 3:30 PM. Ensure all details are correct.
          </p>
        <Button
          onClick={handleSubmitDc}
          disabled={!canSubmit || isSubmitting || !dcDetails || !vehicleNumber.trim()}
          className="w-full md:w-auto"
          size="lg"
        >
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting DC...</> : <><Send className="w-4 h-4 mr-2" /> Finalize and Submit DC</>}
        </Button>
      </CardFooter>
    </Card>
  );
}

