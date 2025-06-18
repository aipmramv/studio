
// src/app/(app)/reports/request-status-summary/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, TableCaption } from "@/components/ui/table";
import { Calendar as CalendarIcon, Filter as FilterIcon, PieChart, FileText, FileSpreadsheet } from "lucide-react";
import { REQUEST_TYPES, REQUEST_STATUSES, MOCK_REQUEST_STATUS_SUMMARY, type RequestType, type RequestStatus, type RequestStatusSummaryItem } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SampleBarChart } from "@/components/charts/SampleBarChart"; // Using SampleBarChart for simplicity

export default function RequestStatusSummaryPage() {
  const [reportData, setReportData] = React.useState<RequestStatusSummaryItem[]>(MOCK_REQUEST_STATUS_SUMMARY);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterRequestType, setFilterRequestType] = React.useState<RequestType | "">("");
  const { toast } = useToast();

  const filteredData = React.useMemo(() => {
    let tempData = [...reportData];
    if (filterRequestType) {
      tempData = tempData.filter(item => item.requestType === filterRequestType);
    }
    // Date range filtering would require actual date fields in mock data,
    // for now, it's a UI placeholder.
    return tempData;
  }, [reportData, dateRange, filterRequestType]);

  const chartData = React.useMemo(() => {
    return REQUEST_STATUSES.map(status => {
      const count = filteredData.reduce((sum, item) => {
        if (status === "Pending") return sum + (item.pending || 0);
        if (status === "Approved") return sum + (item.approved || 0);
        if (status === "Rejected") return sum + (item.rejected || 0);
        if (status === "In Progress") return sum + (item.inProgress || 0);
        if (status === "Completed") return sum + (item.completed || 0);
        return sum;
      }, 0);
      return { name: status, value: count };
    }).filter(d => d.value > 0);
  }, [filteredData]);

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing request status summary for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Request Status Summary"
        description="Overview of requests categorized by type and current status."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center"><PieChart className="w-5 h-5 mr-2 text-primary"/>Report Filters & Actions</CardTitle>
              <CardDescription>Filter data by date range and request type.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full sm:w-auto justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    />
                </PopoverContent>
                </Popover>
              <Select value={filterRequestType} onValueChange={(val) => setFilterRequestType(val as RequestType | "")}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Request Types" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">All Request Types</SelectItem> Removed to fix error */}
                  {REQUEST_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
            </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data available for the selected filters.</p>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Status Breakdown by Request Type</h3>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Type</TableHead>
                        <TableHead className="text-right">Total Submitted</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Rejected</TableHead>
                        <TableHead className="text-right">In Progress</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.requestType}>
                          <TableCell className="font-medium">{item.requestType}</TableCell>
                          <TableCell className="text-right">{item.totalSubmitted.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.pending.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.approved.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.rejected.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(item.inProgress || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(item.completed || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + item.totalSubmitted, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + item.pending, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + item.approved, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + item.rejected, 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + (item.inProgress || 0), 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{filteredData.reduce((sum, item) => sum + (item.completed || 0), 0).toLocaleString()}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
              {chartData.length > 0 && (
                <div>
                  <SampleBarChart
                    data={chartData}
                    title="Overall Request Status Distribution"
                    description={`Based on current filters ${filterRequestType ? `(${filterRequestType})` : ''}.`}
                    dataKeyX="name"
                    dataKeyY="value"
                    fillColor="hsl(var(--primary))"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

