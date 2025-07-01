
// src/app/(app)/reports/material-lifecycle/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar as CalendarIcon, Filter as FilterIcon, Eye, FileText, FileSpreadsheet, PackageSearch,
  Briefcase, CalendarDays, User, ChevronsLeft, ChevronsRight, File, Clock, CircleDot, CheckCircle, Ban
} from "lucide-react";
import { REQUEST_TYPES, LIFECYCLE_STAGES, DEPARTMENTS, type RequestType, type LifecycleStage, type Department } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock Data for Material Lifecycle Report
interface MaterialLifecycleEvent {
  timestamp: string;
  event: string;
  actor: string;
  details?: string;
  attachments?: { name: string; url: string }[];
}

interface MaterialLifecycleItem {
  id: string;
  materialName: string;
  partCode: string;
  kmRefNo: string;
  initialRequestType: RequestType;
  initialRequestId: string;
  requestedBy: string;
  requestedDate: string;
  currentStatus: string;
  possessedBy: string;
  lifecycleStage: LifecycleStage;
  lastUpdated: string;
  timeline: MaterialLifecycleEvent[];
  supplier?: string;
}

const MOCK_LIFECYCLE_DATA: MaterialLifecycleItem[] = [
  {
    id: "ML-001", materialName: "High-Torque Servo Motor", partCode: "SRV-HT-001", kmRefNo: "KM-58293",
    initialRequestType: "Purchase Order", initialRequestId: "PO004", requestedBy: "Ram Kumar", requestedDate: "2024-07-20T10:00:00Z",
    currentStatus: "In Use by R&D", possessedBy: "R&D", lifecycleStage: "In Use", lastUpdated: "2024-07-25T11:00:00Z",
    supplier: "Tech Solutions Inc.",
    timeline: [
      { timestamp: "2024-07-20T10:00:00Z", event: "PO Request Submitted", actor: "Ram Kumar", details: "Request ID: PO004" },
      { timestamp: "2024-07-20T12:30:00Z", event: "Approved by Dept. Head", actor: "Prem Kumar" },
      { timestamp: "2024-07-21T09:00:00Z", event: "Approved by Finance", actor: "Chandrasekar R." },
      { timestamp: "2024-07-21T14:00:00Z", event: "Material Received", actor: "Store Keeper", details: "GRN: GRN2024150", attachments: [{name: "invoice.pdf", url: "#"}] },
      { timestamp: "2024-07-25T11:00:00Z", event: "Material Issued to R&D", actor: "Store Keeper", details: "Issue ID: ISS003" },
    ]
  },
  {
    id: "ML-002", materialName: "Steel Beams (Scrap)", partCode: "STL-B-001", kmRefNo: "KM-10293",
    initialRequestType: "Scrap Request", initialRequestId: "SM002", requestedBy: "Praveen S.", requestedDate: "2024-07-22T14:00:00Z",
    currentStatus: "Pending Scrap Approval", possessedBy: "Scrap Yard", lifecycleStage: "Scrap Pending", lastUpdated: "2024-07-23T10:00:00Z",
    timeline: [
      { timestamp: "2024-07-22T14:00:00Z", event: "Scrap Request Submitted", actor: "Praveen S.", details: "Request ID: SM002", attachments: [{name: "scrap_photo.jpg", url: "#"}] },
      { timestamp: "2024-07-23T10:00:00Z", event: "Approved by Dept. Head", actor: "Nagaraj V." },
    ]
  },
  {
    id: "ML-003", materialName: "Prototype Casing V2", partCode: "PR-CS-V2", kmRefNo: "KM-99812",
    initialRequestType: "Material Movement", initialRequestId: "MM001", requestedBy: "Sashikanth M.", requestedDate: "2024-07-28T09:00:00Z",
    currentStatus: "Received at Destination", possessedBy: "Quality Lab", lifecycleStage: "Received", lastUpdated: "2024-07-28T16:00:00Z",
    timeline: [
      { timestamp: "2024-07-28T09:00:00Z", event: "Movement Request Submitted", actor: "Sashikanth M.", details: "Request ID: MM001" },
      { timestamp: "2024-07-28T11:00:00Z", event: "Approved by All", actor: "System" },
      { timestamp: "2024-07-28T12:00:00Z", event: "DC Generated", actor: "Dispatch Team", details: "DC No: DC20240728-ABC" },
      { timestamp: "2024-07-28T16:00:00Z", event: "Received at Quality Lab", actor: "QA Team" },
    ]
  }
];

const ITEMS_PER_PAGE = 10;

export default function MaterialLifecycleReportPage() {
  const [reportData, setReportData] = React.useState<MaterialLifecycleItem[]>(MOCK_LIFECYCLE_DATA);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterRequestType, setFilterRequestType] = React.useState<RequestType | "">("");
  const [filterLifecycleStage, setFilterLifecycleStage] = React.useState<LifecycleStage | "">("");
  const [filterDepartment, setFilterDepartment] = React.useState<Department | "">("");
  const [filterRequestedBy, setFilterRequestedBy] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedItem, setSelectedItem] = React.useState<MaterialLifecycleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const { toast } = useToast();

  const distinctRequesters = React.useMemo(() => Array.from(new Set(reportData.map(item => item.requestedBy))).sort(), [reportData]);

  const filteredData = React.useMemo(() => {
    let tempData = [...reportData];
    if (dateRange?.from) tempData = tempData.filter(item => new Date(item.requestedDate) >= dateRange.from!);
    if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        tempData = tempData.filter(item => new Date(item.requestedDate) <= toDate);
    }
    if (filterRequestType) tempData = tempData.filter(item => item.initialRequestType === filterRequestType);
    if (filterLifecycleStage) tempData = tempData.filter(item => item.lifecycleStage === filterLifecycleStage);
    if (filterDepartment) tempData = tempData.filter(item => item.possessedBy === filterDepartment);
    if (filterRequestedBy) tempData = tempData.filter(item => item.requestedBy === filterRequestedBy);
    return tempData;
  }, [reportData, dateRange, filterRequestType, filterLifecycleStage, filterDepartment, filterRequestedBy]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = (formatType: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${formatType.toUpperCase()}...`,
      description: `Preparing material lifecycle report. This is a mock action.`,
    });
  };
  
  const handleViewDetails = (item: MaterialLifecycleItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };
  
  const renderTimelineEvent = (event: MaterialLifecycleEvent, index: number) => {
    let icon;
    if (event.event.toLowerCase().includes("approve")) icon = <CheckCircle className="w-5 h-5 text-primary" />;
    else if (event.event.toLowerCase().includes("reject") || event.event.toLowerCase().includes("void")) icon = <Ban className="w-5 h-5 text-destructive" />;
    else icon = <CircleDot className="w-5 h-5 text-muted-foreground" />;

    return (
      <li key={index} className="flex gap-4">
        <div className="flex flex-col items-center">
          {icon}
          <div className="w-px h-full bg-border"></div>
        </div>
        <div className="pb-8">
          <p className="font-semibold text-foreground">{event.event}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.timestamp), "dd MMM yyyy, HH:mm")} by {event.actor}
          </p>
          {event.details && <p className="text-sm mt-1 bg-muted/50 p-2 rounded-md">{event.details}</p>}
          {event.attachments && (
            <div className="mt-2">
              {event.attachments.map((file, fIndex) => (
                <Button key={fIndex} variant="link" size="sm" asChild className="p-0 h-auto">
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <File className="w-3 h-3 mr-1" /> {file.name}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Lifecycle Report"
        description="Drill-down report to track material from request to final disposition."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><PackageSearch className="w-5 h-5 mr-2 text-primary"/>Report Filters & Actions</CardTitle>
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full sm:w-auto justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : (<span>Pick a date range</span>)}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} /></PopoverContent>
              </Popover>
              <Select value={filterRequestType} onValueChange={(val) => setFilterRequestType(val as RequestType | "")}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Request Type" /></SelectTrigger><SelectContent><SelectItem value="">All Request Types</SelectItem>{REQUEST_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
              <Select value={filterLifecycleStage} onValueChange={(val) => setFilterLifecycleStage(val as LifecycleStage | "")}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Lifecycle Stage" /></SelectTrigger><SelectContent><SelectItem value="">All Stages</SelectItem>{LIFECYCLE_STAGES.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select>
              <Select value={filterDepartment} onValueChange={(val) => setFilterDepartment(val as Department | "")}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Possessed By" /></SelectTrigger><SelectContent><SelectItem value="">All Departments</SelectItem>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select>
              <Select value={filterRequestedBy} onValueChange={(val) => setFilterRequestedBy(val as string | "")}><SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Requested By" /></SelectTrigger><SelectContent><SelectItem value="">All Users</SelectItem>{distinctRequesters.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}</SelectContent></Select>
              <div className="flex-grow"></div>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}><FileSpreadsheet className="w-4 h-4 mr-2" />Excel</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}><FileText className="w-4 h-4 mr-2" />PDF</Button>
            </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No material data available for the selected filters.</p>
          ) : (
            <>
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material / Part Code</TableHead>
                    <TableHead>Ref No.</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Requested By & Date</TableHead>
                    <TableHead>Possessed By</TableHead>
                    <TableHead>Lifecycle Stage</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.materialName}<br/><span className="text-xs text-muted-foreground">{item.partCode}</span></TableCell>
                      <TableCell>{item.initialRequestId}</TableCell>
                      <TableCell>{item.initialRequestType}</TableCell>
                      <TableCell>{item.requestedBy}<br/><span className="text-xs text-muted-foreground">{format(new Date(item.requestedDate), "dd MMM yyyy")}</span></TableCell>
                      <TableCell>{item.possessedBy}</TableCell>
                      <TableCell><Badge variant="secondary">{item.lifecycleStage}</Badge></TableCell>
                      <TableCell>{format(new Date(item.lastUpdated), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(item)}><Eye className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Showing {paginatedData.length} of {filteredData.length} material records.</TableCaption>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4 mr-1"/>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next<ChevronsRight className="w-4 h-4 ml-1"/></Button>
            </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {selectedItem && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Material Lifecycle: {selectedItem.materialName}</DialogTitle>
                    <DialogDescription>Request ID: {selectedItem.initialRequestId} | Part Code: {selectedItem.partCode}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-6">
                  <ul className="list-none m-0 p-0 relative">
                    {selectedItem.timeline.map((event, index) => renderTimelineEvent(event, index))}
                  </ul>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
