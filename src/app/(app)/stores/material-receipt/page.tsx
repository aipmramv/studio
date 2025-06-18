
// src/app/(app)/stores/material-receipt/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackagePlus, FileText, Truck } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MaterialReceipt {
  receiptId: string;
  grnNumber?: string; // Goods Receipt Note
  poNumber?: string;
  vendorName: string;
  receiptDate: string;
  storeLocation: string;
  totalItems: number;
  status: "Pending QA" | "Received" | "Partial QA";
}

const mockReceipts: MaterialReceipt[] = [
  { receiptId: "REC001", grnNumber: "GRN2024150", poNumber: "PO2024001", vendorName: "Supplier Alpha", receiptDate: "2024-07-20", storeLocation: "Central Warehouse Alpha", totalItems: 5, status: "Received" },
  { receiptId: "REC002", vendorName: "Local Hardware Inc.", receiptDate: "2024-07-22", storeLocation: "Sub-Store Gamma", totalItems: 12, status: "Pending QA" },
];

export default function MaterialReceiptPage() {
  const [receipts, setReceipts] = React.useState<MaterialReceipt[]>(mockReceipts);
  // Future: Form for new material receipt, integration with POs.

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Receipt Log"
        description="Record and manage incoming materials into various store locations."
        actions={
          <Button>
            <PackagePlus className="w-4 h-4 mr-2" /> New Material Receipt
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Receipts List</CardTitle>
          <CardDescription>Log of all materials received into various store locations. You can add new receipts or view details of existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>GRN / PO</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.receiptId}>
                    <TableCell className="font-medium">{receipt.receiptId}</TableCell>
                    <TableCell>
                      {receipt.grnNumber && <p className="text-xs flex items-center"><Truck className="w-3 h-3 mr-1 text-muted-foreground" />GRN: {receipt.grnNumber}</p>}
                      {receipt.poNumber && <p className="text-xs flex items-center"><FileText className="w-3 h-3 mr-1 text-muted-foreground" />PO: {receipt.poNumber}</p>}
                      {!receipt.grnNumber && !receipt.poNumber && "N/A"}
                    </TableCell>
                    <TableCell>{receipt.vendorName}</TableCell>
                    <TableCell>{receipt.receiptDate}</TableCell>
                    <TableCell>{receipt.storeLocation}</TableCell>
                    <TableCell className="text-right">{receipt.totalItems}</TableCell>
                    <TableCell>
                      <Badge variant={receipt.status === "Received" ? "default" : "secondary"}>{receipt.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{receipts.length} material receipt(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material receipts found. Click "New Material Receipt" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
