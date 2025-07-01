// src/app/(app)/stores/inventory-summary/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { PackageSearch, Search, Filter as FilterIcon, ChevronsLeft, ChevronsRight, Tag as TagIcon, Warehouse as WarehouseIcon, AlertTriangle, CheckCircle, X, FileText, FileSpreadsheet, MoreVertical, Lock, RecycleIcon, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HoldInventorySchema, type HoldInventoryFormData } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { mockInventoryData } from "@/lib/mock-inventory-data";
import type { InventoryItem } from "@/lib/mock-inventory-data";
import { MATERIAL_CATEGORIES } from "@/lib/constants";


const ITEMS_PER_PAGE = 10;

type AvailabilityStatus = "In Stock" | "Low Stock" | "Out of Stock";

const getAvailabilityStatus = (item: InventoryItem): AvailabilityStatus => {
  const availableQty = (item.quantityOnHand || 0) - (item.heldQuantity || 0);
  if (availableQty <= 0) return "Out of Stock";
  if (availableQty <= item.lowStockThreshold) return "Low Stock";
  return "In Stock";
};

const getStatusBadgeVariant = (status: AvailabilityStatus) => {
  if (status === "Out of Stock") return "destructive";
  if (status === "Low Stock") return "secondary"; 
  return "default";
};

const getStatusIcon = (status: AvailabilityStatus) => {
  if (status === "Out of Stock") return <X className="w-4 h-4 mr-2 text-destructive" />;
  if (status === "Low Stock") return <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />;
  return <CheckCircle className="w-4 h-4 mr-2 text-primary" />;
};


export default function InventorySummaryPage() {
  const [version, setVersion] = React.useState(0); // Used to force re-renders
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStoreLocation, setFilterStoreLocation] = React.useState("");
  const [filterMaterialCategory, setFilterMaterialCategory] = React.useState("");
  const [filterAvailability, setFilterAvailability] = React.useState<AvailabilityStatus | "">("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);
  const { toast } = useToast();
  
  const [itemToHold, setItemToHold] = React.useState<InventoryItem | null>(null);
  const [isHoldDialogOpen, setIsHoldDialogOpen] = React.useState(false);
  
  const [itemToFlag, setItemToFlag] = React.useState<InventoryItem | null>(null);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = React.useState(false);


  const inventory = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    version; // Depend on version to re-memoize when data changes
    return mockInventoryData;
  }, [version]);

  const distinctStoreLocations = React.useMemo(() => Array.from(new Set(inventory.map(item => item.storeLocation))).sort(), [inventory]);

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

  const holdForm = useForm<HoldInventoryFormData>({
    resolver: zodResolver(HoldInventorySchema),
    defaultValues: { quantity: 1, reason: "", holdUntil: undefined },
  });

  const handleHoldDialogOpen = (item: InventoryItem) => {
    setItemToHold(item);
    holdForm.reset({
      quantity: 1,
      reason: "",
      holdUntil: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week
    });
    setIsHoldDialogOpen(true);
  };
  
  const handleHoldSubmit = (data: HoldInventoryFormData) => {
    if (!itemToHold) return;
    
    const availableQty = (itemToHold.quantityOnHand || 0) - (itemToHold.heldQuantity || 0);
    if(data.quantity > availableQty) {
      holdForm.setError("quantity", { type: "manual", message: `Cannot hold more than available quantity (${availableQty})` });
      return;
    }

    const itemIndex = mockInventoryData.findIndex(i => i.id === itemToHold.id);
    if(itemIndex !== -1) {
      mockInventoryData[itemIndex] = {
        ...mockInventoryData[itemIndex],
        heldQuantity: (mockInventoryData[itemIndex].heldQuantity || 0) + data.quantity,
        holdReason: data.reason,
        holdUntil: data.holdUntil,
      };
      setVersion(v => v + 1); // Force re-render
      toast({ title: "Item quantity held successfully." });
      setIsHoldDialogOpen(false);
      setItemToHold(null);
    }
  };

  const handleFlagDialogOpen = (item: InventoryItem) => {
    setItemToFlag(item);
    setIsFlagDialogOpen(true);
  };

  const handleFlagConfirm = () => {
    if (!itemToFlag) return;
    const itemIndex = mockInventoryData.findIndex(i => i.id === itemToFlag.id);
     if(itemIndex !== -1) {
      mockInventoryData[itemIndex].isFlaggedForScrap = true;
      setVersion(v => v + 1);
      toast({ title: "Item flagged for scrap." });
      setIsFlagDialogOpen(false);
      setItemToFlag(null);
    }
  };


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
        description="View current material availability, hold quantities, or flag items for scrap."
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
                    <Label htmlFor="filter-store">Store Location</Label>
                    <Select value={filterStoreLocation} onValueChange={(val) => setFilterStoreLocation(val === 'all' ? '' : val)}>
                      <SelectTrigger id="filter-store" className="mt-1"><SelectValue placeholder="All Locations" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {distinctStoreLocations.map(loc => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-category">Material Category</Label>
                    <Select value={filterMaterialCategory} onValueChange={(val) => setFilterMaterialCategory(val === 'all' ? '' : val)}>
                      <SelectTrigger id="filter-category" className="mt-1"><SelectValue placeholder="All Categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {MATERIAL_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-availability">Availability Status</Label>
                    <Select value={filterAvailability} onValueChange={(val) => setFilterAvailability(val === 'all' ? '' : val as AvailabilityStatus)}>
                      <SelectTrigger id="filter-availability" className="mt-1"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {(["In Stock", "Low Stock", "Out of Stock"] as AvailabilityStatus[]).map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
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
                      <TableHead>Material ID / Name</TableHead>
                      <TableHead><WarehouseIcon className="inline w-4 h-4 mr-1 text-muted-foreground"/>Store Location</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead className="text-right">Held</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item) => {
                      const availableQty = (item.quantityOnHand || 0) - (item.heldQuantity || 0);
                      const status = getAvailabilityStatus(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                            <p className="text-xs text-muted-foreground">{item.id}</p>
                          </TableCell>
                          <TableCell>{item.storeLocation}</TableCell>
                          <TableCell className="text-right font-semibold">{item.quantityOnHand}</TableCell>
                          <TableCell className="text-right">{item.heldQuantity || 0}</TableCell>
                          <TableCell className="text-right font-bold">{availableQty}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getStatusBadgeVariant(status)} className="flex items-center w-fit">{getStatusIcon(status)}{status}</Badge>
                              {item.isFlaggedForScrap && <Badge variant="destructive" className="w-fit"><RecycleIcon className="w-3 h-3 mr-1.5"/>Flagged for Scrap</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleHoldDialogOpen(item)}>
                                    <Lock className="w-4 h-4 mr-2"/> Hold Quantity
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => handleFlagDialogOpen(item)} disabled={item.isFlaggedForScrap}>
                                     <RecycleIcon className="w-4 h-4 mr-2"/> Flag for Scrap
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
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
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4 mr-1" /> Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}><ChevronsRight className="w-4 h-4 ml-1" /> Next</Button>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No inventory items match your current search/filters.</p>
          )}
        </CardContent>
      </Card>
      
      {itemToHold && (
         <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hold Quantity for: {itemToHold.name}</DialogTitle>
              <DialogDescription>
                Reserve a specific quantity of this item. It will not be available for other requests until released or the hold expires.
                Available to hold: {(itemToHold.quantityOnHand || 0) - (itemToHold.heldQuantity || 0)}
              </DialogDescription>
            </DialogHeader>
            <Form {...holdForm}>
              <form onSubmit={holdForm.handleSubmit(handleHoldSubmit)} className="space-y-4 py-4">
                <FormField control={holdForm.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity to Hold</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={holdForm.control} name="reason" render={({ field }) => (
                    <FormItem><FormLabel>Reason for Hold</FormLabel><FormControl><Input placeholder="e.g., Reserved for Project X" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={holdForm.control} name="holdUntil" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hold Until</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                    </PopoverContent></Popover>
                    <FormMessage />
                  </FormItem>
                )}/>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit">Confirm Hold</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {itemToFlag && (
        <AlertDialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Flag for Scrap</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to flag "{itemToFlag.name}" for scrap? This indicates it should be processed in a future scrap request. This action can be reversed later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFlagConfirm} className="bg-destructive hover:bg-destructive/90">Flag for Scrap</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
