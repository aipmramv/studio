
// src/app/(app)/stores/inventory-summary/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { PackageSearch, Search, Filter as FilterIcon, ChevronsLeft, ChevronsRight, Package as PackageIcon, Tag as TagIcon, Warehouse as WarehouseIcon, AlertTriangle, CheckCircle, Circle, X, FileText, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STORE_LOCATIONS, MATERIAL_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";


interface InventoryItem {
  id: string;
  name: string;
  category: typeof MATERIAL_CATEGORIES[number];
  storeLocation: typeof STORE_LOCATIONS[number];
  quantityOnHand: number;
  unitOfMeasure: string;
  lastUpdated: Date;
  lowStockThreshold: number;
}

const ITEMS_PER_PAGE = 10;

const mockInventoryData: InventoryItem[] = [
  { id: "MAT001", name: "Steel Rods - 10mm", category: "Raw Material", storeLocation: "Central Warehouse Alpha", quantityOnHand: 150, unitOfMeasure: "Pieces", lastUpdated: new Date("2024-07-30T10:00:00Z"), lowStockThreshold: 50 },
  { id: "MAT002", name: "Circuit Board XB-2", category: "Components", storeLocation: "Electronics Sub-Store", quantityOnHand: 25, unitOfMeasure: "Units", lastUpdated: new Date("2024-07-29T14:30:00Z"), lowStockThreshold: 20 },
  { id: "MAT003", name: "Lubricant Oil Grade 5", category: "Consumables", storeLocation: "Maintenance Store", quantityOnHand: 5, unitOfMeasure: "Liters", lastUpdated: new Date("2024-07-31T09:15:00Z"), lowStockThreshold: 10 },
  { id: "MAT004", name: "Safety Goggles", category: "Safety Equipment", storeLocation: "Central Warehouse Alpha", quantityOnHand: 200, unitOfMeasure: "Pairs", lastUpdated: new Date("2024-07-28T11:00:00Z"), lowStockThreshold: 25 },
  { id: "MAT005", name: "Finished Product A", category: "Finished Goods", storeLocation: "Dispatch Area", quantityOnHand: 75, unitOfMeasure: "Units", lastUpdated: new Date("2024-07-31T16:00:00Z"), lowStockThreshold: 15 },
  { id: "MAT006", name: "Copper Wiring - 2.5mm", category: "Raw Material", storeLocation: "Electronics Sub-Store", quantityOnHand: 500, unitOfMeasure: "Meters", lastUpdated: new Date("2024-07-25T08:30:00Z"), lowStockThreshold: 100 },
  { id: "MAT007", name: "Resistor Pack 1Kohm", category: "Components", storeLocation: "Electronics Sub-Store", quantityOnHand: 0, unitOfMeasure: "Packs", lastUpdated: new Date("2024-07-20T12:00:00Z"), lowStockThreshold: 5 },
];

type AvailabilityStatus = "In Stock" | "Low Stock" | "Out of Stock";

const getAvailabilityStatus = (item: InventoryItem): AvailabilityStatus => {
  if (item.quantityOnHand <= 0) return "Out of Stock";
  if (item.quantityOnHand <= item.lowStockThreshold) return "Low Stock";
  return "In Stock";
};

const getStatusBadgeVariant = (status: AvailabilityStatus) => {
  if (status === "Out of Stock") return "destructive";
  if (status === "Low Stock") return "secondary"; // KONE design might use a specific orange for warning; secondary is a neutral gray
  return "default"; // For 'In Stock', maps to primary color
};

const getStatusIcon = (status: AvailabilityStatus) => {
  if (status === "Out of Stock") return <X className="w-4 h-4 mr-2 text-destructive" />;
  if (status === "Low Stock") return <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />; // KONE might use orange; yellow-500 is a common choice
  return <CheckCircle className="w-4 h-4 mr-2 text-primary" />; // Using primary for "In Stock" as per KONE success color mapping
};


export default function InventorySummaryPage() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>(mockInventoryData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStoreLocation, setFilterStoreLocation] = React.useState("");
  const [filterMaterialCategory, setFilterMaterialCategory] = React.useState("");
  const [filterAvailability, setFilterAvailability] = React.useState<AvailabilityStatus | "">("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);
  const { toast } = useToast();

  const distinctStoreLocations = React.useMemo(() => Array.from(new Set(inventory.map(item => item.storeLocation))).sort(), [inventory]);
  const distinctMaterialCategories = React.useMemo(() => Array.from(new Set(inventory.map(item => item.category))).sort(), [inventory]);
  const availabilityStatuses: AvailabilityStatus[] = ["In Stock", "Low Stock", "Out of Stock"];

  const filteredInventory = React.useMemo(() => {
    let tempItems = [...inventory];

    if (filterStoreLocation) {
      tempItems = tempItems.filter(item => item.storeLocation === filterStoreLocation);
    }
    if (filterMaterialCategory) {
      tempItems = tempItems.filter(item => item.category === filterMaterialCategory);
    }
    if (filterAvailability) {
      tempItems = tempItems.filter(item => getAvailabilityStatus(item) === filterAvailability);
    }
    if (searchTerm) {
      tempItems = tempItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tempItems.sort((a,b) => a.name.localeCompare(b.name));
  }, [inventory, searchTerm, filterStoreLocation, filterMaterialCategory, filterAvailability]);

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setFilterStoreLocation("");
    setFilterMaterialCategory("");
    setFilterAvailability("");
    setIsFiltersApplied(false);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setIsFiltersApplied(true);
    setCurrentPage(1);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing inventory summary for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory Summary"
        description="View current material availability across all store locations."
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center">
                <PackageSearch className="w-6 h-6 mr-2 text-primary" />
                Material Stock Levels
              </CardTitle>
              <CardDescription>
                Overview of on-hand quantities, categories, and store locations.
              </CardDescription>
            </div>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <FilterIcon className="w-4 h-4 mr-2" /> Filters {isFiltersApplied && <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4" align="end">
                  <div>
                    <label htmlFor="filter-store" className="text-sm font-medium">Store Location</label>
                    <Select value={filterStoreLocation} onValueChange={setFilterStoreLocation}>
                      <SelectTrigger id="filter-store" className="mt-1">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Locations</SelectItem>
                        {distinctStoreLocations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="filter-category" className="text-sm font-medium">Material Category</label>
                    <Select value={filterMaterialCategory} onValueChange={setFilterMaterialCategory}>
                      <SelectTrigger id="filter-category" className="mt-1">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {distinctMaterialCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="filter-availability" className="text-sm font-medium">Availability Status</label>
                    <Select value={filterAvailability} onValueChange={(value) => setFilterAvailability(value as AvailabilityStatus | "")}>
                      <SelectTrigger id="filter-availability" className="mt-1">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {availabilityStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear</Button>
                    <Button size="sm" onClick={handleApplyFilters}>Apply</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Material ID or Name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {paginatedInventory.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead><TagIcon className="inline w-4 h-4 mr-1 text-muted-foreground"/>Category</TableHead>
                      <TableHead><WarehouseIcon className="inline w-4 h-4 mr-1 text-muted-foreground"/>Store Location</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item) => {
                      const status = getAvailabilityStatus(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                          <TableCell>{item.storeLocation}</TableCell>
                          <TableCell className="text-right font-semibold">{item.quantityOnHand}</TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(status)} className="flex items-center w-fit">
                              {getStatusIcon(status)}
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{format(item.lastUpdated, "yyyy-MM-dd HH:mm")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableCaption>
                    Showing {paginatedInventory.length} of {filteredInventory.length} inventory items.
                    Page {currentPage} of {totalPages}.
                  </TableCaption>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronsRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No inventory items match your current search/filters, or no items available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
