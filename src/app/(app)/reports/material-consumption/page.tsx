
// src/app/(app)/reports/material-consumption/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter, TableCaption } from "@/components/ui/table";
import { Calendar as CalendarIcon, Filter as FilterIcon, BarChartHorizontalBig, FileText, FileSpreadsheet, Package as PackageIcon, Tag as TagIcon, Briefcase as BriefcaseIcon, Warehouse as WarehouseIcon } from "lucide-react";
import { MATERIAL_TYPES, STORE_LOCATIONS, DEPARTMENTS, MOCK_MATERIAL_CONSUMPTION, type MaterialType, type StoreLocationType, type Department, type MaterialConsumptionItem } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SampleBarChart } from "@/components/charts/SampleBarChart";

export default function MaterialConsumptionReportPage() {
  const [reportData, setReportData] = React.useState<MaterialConsumptionItem[]>(MOCK_MATERIAL_CONSUMPTION);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterMaterialType, setFilterMaterialType] = React.useState<MaterialType | "">("");
  const [filterStoreLocation, setFilterStoreLocation] = React.useState<StoreLocationType | "">("");
  const [filterDepartment, setFilterDepartment] = React.useState<Department | "">("");
  const { toast } = useToast();

  const filteredData = React.useMemo(() => {
    let tempData = [...reportData];
    if (dateRange?.from) {
      tempData = tempData.filter(item => new Date(item.dateIssued) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23,59,59,999);
      tempData = tempData.filter(item => new Date(item.dateIssued) <= toDate);
    }
    if (filterMaterialType) {
      // Assuming materialName contains type or materialCategory is directly filterable
      tempData = tempData.filter(item => item.materialCategory === filterMaterialType);
    }
    if (filterStoreLocation) {
      tempData = tempData.filter(item => item.issuingStore === filterStoreLocation);
    }
    if (filterDepartment) {
      tempData = tempData.filter(item => item.issuedToDepartment === filterDepartment);
    }
    return tempData;
  }, [reportData, dateRange, filterMaterialType, filterStoreLocation, filterDepartment]);

  const chartData = React.useMemo(() => {
    const consumptionByMaterial: { [key: string]: number } = {};
    filteredData.forEach(item => {
      consumptionByMaterial[item.materialName] = (consumptionByMaterial[item.materialName] || 0) + item.quantityIssued;
    });
    return Object.entries(consumptionByMaterial)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 consumed materials
  }, [filteredData]);
  
  const formattingOptions = { minimumFractionDigits: 0, maximumFractionDigits: 0 };


  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing material consumption report for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Consumption Report"
        description="Track materials issued from stores to various departments."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="w-5 h-5 mr-2 text-primary"/>Report Filters & Actions</CardTitle>
              <CardDescription>Filter consumption data by date, material, store, or department.</CardDescription>
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
              <Select value={filterMaterialType} onValueChange={(val) => setFilterMaterialType(val as MaterialType | "")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Material Types" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">All Material Types</SelectItem> Removed to fix error */}
                  {MATERIAL_TYPES.map(type => <SelectItem key={type} value={type}><TagIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStoreLocation} onValueChange={(val) => setFilterStoreLocation(val as StoreLocationType | "")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">All Stores</SelectItem> Removed to fix error */}
                  {STORE_LOCATIONS.map(loc => <SelectItem key={loc} value={loc}><WarehouseIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{loc}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterDepartment} onValueChange={(val) => setFilterDepartment(val as Department | "")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">All Departments</SelectItem> Removed to fix error */}
                  {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}><BriefcaseIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{dept}</SelectItem>)}
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
            <p className="text-center text-muted-foreground py-8">No consumption data available for the selected filters.</p>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Material Consumption Details</h3>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material ID</TableHead>
                        <TableHead>Material Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty Issued</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Issued To Dept.</TableHead>
                        <TableHead>Issuing Store</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={`${item.materialId}-${item.dateIssued}-${item.issuedToDepartment}`}>
                          <TableCell className="font-medium">{item.materialId}</TableCell>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell><TagIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{item.materialCategory}</TableCell>
                          <TableCell className="text-right">{item.quantityIssued.toLocaleString(undefined, formattingOptions)}</TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>{format(new Date(item.dateIssued), "yyyy-MM-dd")}</TableCell>
                          <TableCell><BriefcaseIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{item.issuedToDepartment}</TableCell>
                          <TableCell><WarehouseIcon className="inline w-3 h-3 mr-1 text-muted-foreground"/>{item.issuingStore}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                     <TableCaption>{filteredData.length} consumption record(s) found.</TableCaption>
                  </Table>
                </div>
              </div>
              {chartData.length > 0 && (
                <div>
                  <SampleBarChart
                    data={chartData}
                    title="Top 10 Consumed Materials by Quantity"
                    description="Based on current filters."
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

