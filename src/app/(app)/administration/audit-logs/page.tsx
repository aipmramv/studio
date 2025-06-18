
// src/app/(app)/administration/audit-logs/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { FileArchive, Search, Filter as FilterIcon, Calendar as CalendarIcon, User, Tag, ChevronsLeft, ChevronsRight, X, FileText, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  status: 'success' | 'failure' | 'info' | 'warning';
}

const ITEMS_PER_PAGE = 10;

const initialMockAuditLogs: AuditLogEntry[] = [
  { id: "log001", timestamp: new Date("2024-07-31T10:00:00Z"), user: "admin@example.com", action: "LOGIN_SUCCESS", details: "User logged in successfully.", ipAddress: "192.168.1.10", status: 'success' },
  { id: "log002", timestamp: new Date("2024-07-31T10:05:00Z"), user: "approver@example.com", action: "REQUEST_APPROVED", entityType: "Purchase Order", entityId: "PO004", details: "Approved PO004 for IT equipment.", ipAddress: "192.168.1.15", status: 'success' },
  { id: "log003", timestamp: new Date("2024-07-31T10:10:00Z"), user: "requester@example.com", action: "REQUEST_SUBMITTED", entityType: "Material Movement", entityId: "MM001", details: "Submitted new material movement request.", ipAddress: "192.168.1.20", status: 'info' },
  { id: "log004", timestamp: new Date("2024-07-31T10:15:00Z"), user: "admin@example.com", action: "WORKFLOW_UPDATED", entityType: "WorkflowTemplate", entityId: "po_default", details: "Updated PO approval workflow steps.", ipAddress: "192.168.1.10", status: 'info' },
  { id: "log005", timestamp: new Date("2024-07-31T10:20:00Z"), user: "admin@example.com", action: "LOGIN_FAILED", details: "Failed login attempt for user admin@example.com.", ipAddress: "192.168.1.10", status: 'failure' },
  { id: "log006", timestamp: new Date("2024-07-31T10:25:00Z"), user: "requester@example.com", action: "REQUEST_REJECTED", entityType: "Work Permit", entityId: "WP005", details: "Work permit WP005 rejected due to missing safety plan.", ipAddress: "192.168.1.22", status: 'failure' },
  { id: "log007", timestamp: new Date("2024-08-01T09:00:00Z"), user: "finance@example.com", action: "PO_FINALIZED", entityType: "Purchase Order", entityId: "PO003", details: "Purchase Order PO003 marked as finalized.", ipAddress: "192.168.1.30", status: 'success'},
  { id: "log008", timestamp: new Date("2024-08-01T11:30:00Z"), user: "safety_officer@example.com", action: "PERMIT_ISSUED", entityType: "Work Permit", entityId: "WP006", details: "Work Permit WP006 for hot work issued.", ipAddress: "192.168.1.35", status: 'success'},
  { id: "log009", timestamp: new Date("2024-08-01T15:00:00Z"), user: "user@example.com", action: "SETTINGS_UPDATED", entityType: "UserPreferences", entityId: "user@example.com", details: "User updated notification preferences.", ipAddress: "192.168.1.40", status: 'info'},
  { id: "log010", timestamp: new Date("2024-08-02T10:00:00Z"), user: "admin@example.com", action: "USER_ROLE_CHANGED", entityType: "User", entityId: "bob@example.com", details: "User Bob's role changed to 'approver'.", ipAddress: "192.168.1.10", status: 'warning'},
  { id: "log011", timestamp: new Date("2024-08-02T14:00:00Z"), user: "approver@example.com", action: "SCRAP_REQUEST_APPROVED", entityType: "Scrap Request", entityId: "SM003", details: "Scrap request SM003 approved for disposal.", ipAddress: "192.168.1.15", status: 'success'},
  { id: "log012", timestamp: new Date("2024-08-03T10:00:00Z"), user: "admin@example.com", action: "SYSTEM_BACKUP", details: "System backup completed successfully.", ipAddress: "SYSTEM", status: 'info' },
  { id: "log013", timestamp: new Date("2024-08-03T11:00:00Z"), user: "requester@example.com", action: "REQUEST_SUBMITTED", entityType: "Sale Order", entityId: "SO008", details: "New sale order SO008 submitted.", ipAddress: "192.168.1.25", status: 'info' },
  { id: "log014", timestamp: new Date("2024-08-03T12:00:00Z"), user: "admin@example.com", action: "EMAIL_TEMPLATE_UPDATED", entityType: "EmailTemplate", entityId: "et_request_approved", details: "Email template for request approval updated.", ipAddress: "192.168.1.10", status: 'info' },
  { id: "log015", timestamp: new Date("2024-08-04T09:30:00Z"), user: "approver@example.com", action: "REQUEST_APPROVED", entityType: "Material Movement", entityId: "MM002", details: "Approved MM002 for internal transfer.", ipAddress: "192.168.1.15", status: 'success' },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(initialMockAuditLogs);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterUser, setFilterUser] = React.useState("");
  const [filterAction, setFilterAction] = React.useState("");
  const [filterEntityType, setFilterEntityType] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);
  const { toast } = useToast();

  const distinctActions = React.useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const distinctEntityTypes = React.useMemo(() => {
    const types = new Set(logs.filter(log => log.entityType).map(log => log.entityType!));
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = React.useMemo(() => {
    let tempLogs = [...logs];

    if (dateRange?.from) {
      tempLogs = tempLogs.filter(log => log.timestamp >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // Include whole day
      tempLogs = tempLogs.filter(log => log.timestamp <= toDate);
    }
    if (filterUser) {
      tempLogs = tempLogs.filter(log => log.user.toLowerCase().includes(filterUser.toLowerCase()));
    }
    if (filterAction) {
      tempLogs = tempLogs.filter(log => log.action === filterAction);
    }
    if (filterEntityType) {
      tempLogs = tempLogs.filter(log => log.entityType === filterEntityType);
    }

    if (searchTerm) {
      tempLogs = tempLogs.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityType && log.entityType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ipAddress && log.ipAddress.includes(searchTerm))
      );
    }
    return tempLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs, searchTerm, dateRange, filterUser, filterAction, filterEntityType]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setDateRange(undefined);
    setFilterUser("");
    setFilterAction("");
    setFilterEntityType("");
    setIsFiltersApplied(false);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setIsFiltersApplied(true);
    setCurrentPage(1);
    // Popover will close automatically if we don't prevent it.
    // For now, this is fine. Could add manual close if needed.
  };

  const getBadgeVariant = (status: AuditLogEntry['status']) => {
    switch (status) {
      case 'success': return 'default';
      case 'failure': return 'destructive';
      case 'info': return 'secondary';
      case 'warning': return 'outline';
      default: return 'secondary';
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing audit logs for ${format} export. This is a mock action.`,
    });
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="System Audit Logs"
        description="Track all critical system actions, changes, and events for compliance and governance."
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center">
                <FileArchive className="w-6 h-6 mr-2 text-primary" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Detailed records of user activities, system events, and data modifications.
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
                    <label htmlFor="date-range" className="text-sm font-medium">Date Range</label>
                    <Calendar
                      id="date-range"
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      className="rounded-md border p-0 mt-1"
                      numberOfMonths={1}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-user" className="text-sm font-medium">User Email</label>
                    <Input
                      id="filter-user"
                      placeholder="e.g., admin@example.com"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                   <div>
                    <label htmlFor="filter-action" className="text-sm font-medium">Action Type</label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger id="filter-action" className="mt-1">
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* <SelectItem value="">All Actions</SelectItem> Removed to fix error */}
                        {distinctActions.map(action => (
                          <SelectItem key={action} value={action}>{action}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <label htmlFor="filter-entity" className="text-sm font-medium">Entity Type</label>
                    <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                      <SelectTrigger id="filter-entity" className="mt-1">
                        <SelectValue placeholder="All Entities" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* <SelectItem value="">All Entities</SelectItem> Removed to fix error */}
                         {distinctEntityTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
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
                placeholder="Search logs (user, action, ID, details, IP...)"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {paginatedLogs.length > 0 ? (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell><Badge variant={getBadgeVariant(log.status)}>{log.action}</Badge></TableCell>
                      <TableCell className="text-xs">
                        {log.entityType && <div>{log.entityType}{log.entityId && `: ${log.entityId}`}</div>}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                      <TableCell className="text-xs">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Showing {paginatedLogs.length} of {filteredLogs.length} log entries.
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
              No audit logs match your current search/filters, or no logs available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
