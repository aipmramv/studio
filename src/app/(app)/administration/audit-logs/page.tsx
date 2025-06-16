
// src/app/(app)/administration/audit-logs/page.tsx
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { FileArchive, Search, Filter } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge"; // Added missing import

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
}

const mockAuditLogs: AuditLogEntry[] = [
  { id: "log001", timestamp: "2024-07-31T10:00:00Z", user: "admin@example.com", action: "LOGIN_SUCCESS", details: "User logged in successfully.", ipAddress: "192.168.1.10" },
  { id: "log002", timestamp: "2024-07-31T10:05:00Z", user: "approver@example.com", action: "REQUEST_APPROVED", entityType: "Purchase Order", entityId: "PO004", details: "Approved PO004 for IT equipment.", ipAddress: "192.168.1.15" },
  { id: "log003", timestamp: "2024-07-31T10:10:00Z", user: "requester@example.com", action: "REQUEST_SUBMITTED", entityType: "Material Movement", entityId: "MM001", details: "Submitted new material movement request.", ipAddress: "192.168.1.20" },
  { id: "log004", timestamp: "2024-07-31T10:15:00Z", user: "admin@example.com", action: "WORKFLOW_UPDATED", entityType: "WorkflowTemplate", entityId: "po_default", details: "Updated PO approval workflow steps.", ipAddress: "192.168.1.10" },
  { id: "log005", timestamp: "2024-07-31T10:20:00Z", user: "admin@example.com", action: "LOGIN_FAILED", details: "Failed login attempt for user admin@example.com.", ipAddress: "192.168.1.10" },
  { id: "log006", timestamp: "2024-07-31T10:25:00Z", user: "requester@example.com", action: "REQUEST_REJECTED", entityType: "Work Permit", entityId: "WP005", details: "Work permit WP005 rejected due to missing safety plan.", ipAddress: "192.168.1.22" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = React.useState("");
  // Add more filters for date range, user, action type etc.

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.entityType && log.entityType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="System Audit Logs"
        description="Track all critical system actions, changes, and events for compliance and governance."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileArchive className="w-6 h-6 mr-2 text-primary" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Detailed records of user activities, system events, and data modifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search logs (user, action, ID, details...)" 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>

          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell><Badge variant={log.action.includes("FAIL") || log.action.includes("REJECT") ? "destructive" : "secondary"}>{log.action}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {log.entityType && <div>{log.entityType}{log.entityId && `: ${log.entityId}`}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{filteredLogs.length} log entries found.</TableCaption>
            </Table>
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
