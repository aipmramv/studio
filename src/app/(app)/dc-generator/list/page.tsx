// src/app/(app)/dc-generator/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Printer, FileText, ListChecks } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { PrintableDc, type FinalDcData } from "@/components/shared/PrintableDc";

// Mock data for a list of previously generated DCs
const mockGeneratedDcs: FinalDcData[] = [
  {
    dcNumber: "DC20240803-ABCDE",
    approvedRequestID: "MM001",
    approvedRequestType: "Material Movement",
    source: "Central Warehouse",
    destination: "Production Line A",
    materials: [
      { sno: 1, description: "Steel Rods (6m)", quantity: 20, uom: "Pieces", value: 50000 },
      { sno: 2, description: "Connector Assemblies", quantity: 100, uom: "Units", value: 10000 },
    ],
    date: "2024-08-03",
    vehicleNumber: "MH12AB1234",
    eWayBillRef: "",
    totalValue: 60000,
  },
  {
    dcNumber: "DC20240802-FGHIJ",
    approvedRequestID: "SO005",
    approvedRequestType: "Sale Order",
    source: "Finished Goods Store",
    destination: "Client XYZ Corp",
    materials: [
      { sno: 1, description: "Product Model X (Assembled)", quantity: 5, uom: "Units", value: 250000 },
      { sno: 2, description: "Accessory Kit Alpha", quantity: 5, uom: "Kits", value: 15000 },
    ],
    date: "2024-08-02",
    vehicleNumber: "KA05KL5678",
    eWayBillRef: "https://ewaybillgst.gov.in/mock/987654321",
    totalValue: 265000,
  },
  {
    dcNumber: "DC20240801-KLMNO",
    approvedRequestID: "MM008",
    approvedRequestType: "Material Movement",
    source: "Warehouse B",
    destination: "Testing Lab",
    materials: [
      { sno: 1, description: "High-Purity Solvents", quantity: 2, uom: "Liters", value: 8000 },
    ],
    date: "2024-08-01",
    vehicleNumber: "TN22PQ9012",
    eWayBillRef: "",
    totalValue: 8000,
  },
];

export default function DeliveryChallanListPage() {
  const [dcList] = React.useState<FinalDcData[]>(mockGeneratedDcs);
  const [dcToPrint, setDcToPrint] = React.useState<FinalDcData | null>(null);

  const handlePrint = (dc: FinalDcData) => {
    setDcToPrint(dc);
    setTimeout(() => {
      window.print();
      setDcToPrint(null); // Clear after printing to hide the component again
    }, 100);
  };
  
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };


  return (
    <>
      <div className="no-print space-y-8">
        <PageHeader
          title="View Delivery Challans (DCs)"
          description="View and manage all generated Delivery Challans."
          actions={
            <Button asChild>
              <Link href="/dc-generator">
                <PlusCircle className="w-4 h-4 mr-2" /> Generate New DC
              </Link>
            </Button>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="w-5 h-5 mr-2 text-primary"/>Generated Delivery Challans</CardTitle>
            <CardDescription>
              Below is a list of all previously generated DCs. Use the print action to get a copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dcList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DC Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source Request</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dcList.map((dc) => (
                    <TableRow key={dc.dcNumber}>
                      <TableCell className="font-medium">{dc.dcNumber}</TableCell>
                      <TableCell>{format(new Date(dc.date), "dd-MMM-yyyy")}</TableCell>
                      <TableCell>{dc.approvedRequestID}</TableCell>
                      <TableCell>{dc.destination}</TableCell>
                      <TableCell>{dc.vehicleNumber}</TableCell>
                      <TableCell className="text-right">{dc.totalValue.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handlePrint(dc)}>
                          <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{dcList.length} Delivery Challan(s) found.</TableCaption>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No Delivery Challans have been generated yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {dcToPrint && <PrintableDc dcData={dcToPrint} />}
    </>
  );
}
