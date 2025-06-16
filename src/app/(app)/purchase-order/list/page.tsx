
// src/app/(app)/purchase-order/list/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";

interface PurchaseOrderItemDisplay {
  poNumber: string;
  vendorName: string;
  poDate: string; // Keep as string for display
  totalAmount: number;
  currency: Currency;
  status: "Pending" | "Approved" | "Rejected" | "Fulfilled";
}

const mockPurchaseOrders: PurchaseOrderItemDisplay[] = [
  { poNumber: "PO2024001", vendorName: "Supplier Alpha", poDate: "2024-07-15", totalAmount: 150000, currency: "INR", status: "Approved" },
  { poNumber: "PO2024002", vendorName: "Vendor Beta Gmbh", poDate: "2024-07-18", totalAmount: 2500, currency: "EUR", status: "Pending" },
  { poNumber: "PO2024003", vendorName: "Service Provider Charlie", poDate: "2024-07-20", totalAmount: 75000, currency: "INR", status: "Fulfilled" },
];

export default function PurchaseOrderListPage() {
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrderItemDisplay[]>(mockPurchaseOrders);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Purchase Order Requests"
        description="View and manage all purchase order requests."
        actions={
          <Button asChild>
            <Link href="/purchase-order/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Purchase Order
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>A list of all created purchase orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.poNumber}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.vendorName}</TableCell>
                    <TableCell>{new Date(po.poDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                       {CURRENCY_SYMBOLS[po.currency]}{po.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          po.status === "Approved" ? "default" :
                          po.status === "Pending" ? "secondary" :
                          po.status === "Rejected" ? "destructive" :
                          "outline"
                        }
                        className="capitalize"
                      >
                        {po.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details" className="text-primary hover:text-primary/80">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit PO" disabled={po.status !== "Pending"} className="text-accent hover:text-accent/80">
                        <Edit className="w-4 h-4" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Delete PO" disabled={po.status !== "Pending"} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableCaption>{purchaseOrders.length} purchase order(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No purchase orders found. <Link href="/purchase-order/new" className="text-primary hover:underline">Create one now</Link>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
