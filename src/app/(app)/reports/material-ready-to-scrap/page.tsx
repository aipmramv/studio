// src/app/(app)/reports/material-ready-to-scrap/page.tsx
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
import { Calendar as CalendarIcon, Filter as FilterIcon, FileText, FileSpreadsheet, Recycle, Search, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { allRequestsSource } from "@/lib/mock-data";
import { type ScrapMovementFormData } from "@/lib/schemas";
import { SCRAP_TYPES, DEPARTMENTS } from "@/lib/constants";
import type { ApprovalItem } from "@/lib/mock-data";

interface ReadyScrapItem extends ApprovalItem {
    payload: ScrapMovementFormData;
}

const ITEMS_PER_PAGE = 10;

export default function MaterialReadyToScrapReportPage() {
  const [reportData, setReportData] = React.useState<ReadyScrapItem[]>([]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterScrapType, setFilterScrapType] = React.useState<string>("");
  const [filterDepartment, setFilterDepartment] = React.useState<string>("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const { toast } = useToast();
  
  React.useEffect(() => {
    // Filter for scrap requests that are at the final approval step, ready for dispatch
    const readyScrap = allRequestsSource.filter(
        (req): req is ReadyScrapItem => 
            req.requestType === 'Scrap Request' && 
            req.currentStepName === 'MM Head Approval & Dispatch' && // Final approval step before dispatch
            !req.isVoided
    );
    setReportData(readyScrap);
  }, []);

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
    if (filterScrapType) {
      tempData = tempData.filter(item => item.payload.scrapType === filterScrapType);
    }
    if (filterDepartment) {
      tempData = tempData.filter(item => item.requesterDepartment === filterDepartment);
    }
    if (searchTerm) {
        tempData = tempData.filter(item => 
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.payload.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    return tempData.sort((a,b) => new Date(a.history.find(h => h.action === 'approve')?.timestamp || a.submissionDate).getTime() - new Date(b.history.find(h => h.action === 'approve')?.timestamp || b.submissionDate).getTime());
  }, [reportData, dateRange, filterScrapType, filterDepartment, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = (formatType: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${formatType.toUpperCase()}...`,
      description: `Preparing 'Ready to Scrap' report for ${formatType} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Ready to Scrap Report"
        description="View all scrap items that have been fully approved and are awaiting dispatch."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center"><Recycle className="w-5 h-5 mr-2 text-primary"/>Approved Scrap Items</CardTitle>
              <CardDescription>Filter data by date, scrap type, or department.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full sm:w-auto justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : (<span>Pick a date range</span>)}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
              </Popover>
              <Select value={filterScrapType} onValueChange={setFilterScrapType}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Scrap Types" /></SelectTrigger><SelectContent>{SCRAP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger><SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
            <div className="relative flex-grow mb-6"><Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by Request ID, Requester, Description..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No approved scrap items are currently pending dispatch.</p>
          ) : (
            <>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Final Approval Date</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Scrap Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => {
                    const finalApproval = item.history.slice().reverse().find(h => h.action === 'approve');
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{finalApproval ? format(new Date(finalApproval.timestamp), 'dd-MMM-yyyy') : 'N/A'}</TableCell>
                            <TableCell>{item.requesterName}</TableCell>
                            <TableCell>{item.requesterDepartment}</TableCell>
                            <TableCell>{item.payload.scrapType}</TableCell>
                            <TableCell className="max-w-xs truncate" title={item.payload.description}>{item.payload.description}</TableCell>
                            <TableCell className="text-right">{item.payload.weight}</TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
                <TableCaption>Showing {paginatedData.length} of {filteredData.length} items.</TableCaption>
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