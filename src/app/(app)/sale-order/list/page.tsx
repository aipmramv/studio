
// src/app/(app)/sale-order/list/page.tsx
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

interface SaleOrderItemDisplay {
  soNumber: string;
  customerName: string;
  soDate: string; // Keep as string for display
  totalAmount: number;
  currency: Currency;
  status: "Draft" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
}

const mockSaleOrders: SaleOrderItemDisplay[] = [
  { soNumber: "SO2024001", customerName: "Customer X Inc.", soDate: "2024-07-22", totalAmount: 85000, currency: "INR", status: "Confirmed" },
  { soNumber: "SO2024002", customerName: "Client Y Solutions", soDate: "2024-07-25", totalAmount: 1200, currency: "EUR", status: "Draft" },
  { soNumber: "SO2024003", customerName: "Partner Z Ltd.", soDate: "2024-07-28", totalAmount: 300000, currency: "INR", status: "Shipped" },
];

export default function SaleOrderListPage() {
  const [saleOrders, setSaleOrders] = React.useState<SaleOrderItemDisplay[]>(mockSaleOrders);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sale Order Requests"
        description="View and manage all sale order requests."
        actions={
          <Button asChild>
            <Link href="/sale-order/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Sale Order
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Sale Order List</CardTitle>
          <CardDescription>A list of all created sale orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {saleOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleOrders.map((so) => (
                  <TableRow key={so.soNumber}>
                    <TableCell className="font-medium">{so.soNumber}</TableCell>
                    <TableCell>{so.customerName}</TableCell>
                    <TableCell>{new Date(so.soDate).toLocaleDateString()}</TableCell>
                     <TableCell className="text-right">
                       {CURRENCY_SYMBOLS[so.currency]}{so.totalAmount.toLocaleString(so.currency === 'INR' ? 'en-IN' : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          so.status === "Confirmed" || so.status === "Shipped" || so.status === "Delivered" ? "default" :
                          so.status === "Draft" ? "secondary" :
                          so.status === "Cancelled" ? "destructive" :
                          "outline"
                        }
                        className="capitalize"
                      >
                        {so.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" title="View Details" className="text-primary hover:text-primary/80">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit SO" disabled={so.status !== "Draft"} className="text-accent hover:text-accent/80">
                        <Edit className="w-4 h-4" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Delete SO" disabled={so.status !== "Draft"} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{saleOrders.length} sale order(s) found.</TableCaption>
            </Table>
          ) : (
             <p className="text-center text-muted-foreground py-4">No sale orders found. <Link href="/sale-order/new" className="text-primary hover:underline">Create one now</Link>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
