
// src/app/(app)/reports/po-yet-to-receive/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Filter as FilterIcon, FileText, FileSpreadsheet, ShoppingCart, Search, ChevronsLeft, ChevronsRight, Clock } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { allRequestsSource } from "@/lib/mock-data";
import { type PurchaseOrderFormData } from "@/lib/schemas";
import { DEPARTMENTS } from "@/lib/constants";
import type { ApprovalItem } from "@/lib/mock-data";

interface PendingPoItem extends ApprovalItem {
    payload: PurchaseOrderFormData;
}

const ITEMS_PER_PAGE = 10;

export default function PoYetToReceiveReportPage() {
  const [reportData, setReportData] = React.useState<PendingPoItem[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterVendor, setFilterVendor] = React.useState<string>("");
  const [filterDepartment, setFilterDepartment] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const { toast } = useToast();
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };
  
  React.useEffect(() => {
    // Filter for POs that are approved by finance but not yet fulfilled
    const pendingPOs = allRequestsSource.filter(
        (req): req is PendingPoItem => 
            req.requestType === 'Purchase Order' && 
            req.currentStepId === 'po_sap_creation' && // This is the step after finance approval
            !req.isVoided
    );
    setReportData(pendingPOs);
  }, []);

  const vendors = React.useMemo(() => Array.from(new Set(reportData.map(item => item.payload.vendorName))).sort(), [reportData]);

  const filteredData = React.useMemo(() => {
    let tempData = [...reportData];
    if (dateRange?.from) {
      tempData = tempData.filter(item => new Date(item.submissionDate) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      tempData = tempData.filter(item => new Date(item.submissionDate) <= toDate);
    }
    if (filterVendor) {
      tempData = tempData.filter(item => item.payload.vendorName === filterVendor);
    }
    if (filterDepartment) {
      tempData = tempData.filter(item => item.requesterDepartment === filterDepartment);
    }
    if (searchTerm) {
        tempData = tempData.filter(item => 
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.payload.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    return tempData.sort((a,b) => new Date(a.payload.poDate).getTime() - new Date(b.payload.poDate).getTime());
  }, [reportData, dateRange, filterVendor, filterDepartment, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = (formatType: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${formatType.toUpperCase()}...`,
      description: `Preparing 'PO Yet to Receive' report for ${formatType} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="PO - Material Yet to be Received"
        description="View all Purchase Orders that have been approved but are awaiting fulfillment/receipt."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center"><Clock className="w-5 h-5 mr-2 text-primary"/>Pending Purchase Orders</CardTitle>
              <CardDescription>Filter data by date, vendor, or department.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
             <Popover>
                <PopoverTrigger asChild><Button variant={"outline"} className="w-full sm:w-auto justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : (<span>Pick PO Date Range</span>)}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
              </Popover>
              <Select value={filterVendor || "all"} onValueChange={(val) => setFilterVendor(val === 'all' ? '' : val)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Vendors" /></SelectTrigger><SelectContent><SelectItem value="all">All Vendors</SelectItem>{vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
              <Select value={filterDepartment || "all"} onValueChange={(val) => setFilterDepartment(val === 'all' ? '' : val)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger><SelectContent><SelectItem value="all">All Departments</SelectItem>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
            <div className="relative flex-grow mb-6"><Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by PO ID, Requester, Item Name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No POs are currently awaiting receipt.</p>
          ) : (
            <>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => {
                    const totalValue = item.payload.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice) * (1 + (i.gstPercentage || 0) / 100), 0);
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{format(new Date(item.payload.poDate), 'dd-MMM-yyyy')}</TableCell>
                            <TableCell>{item.payload.vendorName}</TableCell>
                            <TableCell>{item.requesterName}</TableCell>
                            <TableCell>{item.payload.department}</TableCell>
                            <TableCell className="text-right">{totalValue.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
                <TableCaption>Showing {paginatedData.length} of {filteredData.length} POs.</TableCaption>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4 mr-1" /> Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next <ChevronsRight className="w-4 h-4 ml-1" /></Button>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
