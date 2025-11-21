// src/app/(app)/asset-transactions/feedback/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Loader2, Handshake, Check, X, Clock, Edit } from "lucide-react";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

type FeedbackStatus = "Open" | "In Progress" | "Resolved";
interface FeedbackItem {
  id: string;
  assetNumber: string;
  assetDescription: string;
  category: "Data Issue" | "Condition" | "Location Mismatch" | "Other";
  submittedOn: Date;
  submittedBy: string;
  details: string;
  status: FeedbackStatus;
}

const mockFeedbackData: FeedbackItem[] = [
    { id: "FBK-001", assetNumber: "KONE-RD-OSC-001", assetDescription: "Tektronix Oscilloscope", category: "Condition", submittedOn: new Date("2024-07-28"), submittedBy: "Praveen S.", details: "Screen flickers occasionally.", status: "Open" },
    { id: "FBK-002", assetNumber: "KONE-RD-LAP-001", assetDescription: "Dell Latitude 5420 Laptop", category: "Data Issue", submittedOn: new Date("2024-07-25"), submittedBy: "Ram Kumar", details: "Serial number in system is incorrect.", status: "Resolved" },
    { id: "FBK-003", assetNumber: "KONE-MAINT-TOOL-001", assetDescription: "Fluke 87V Multimeter", category: "Location Mismatch", submittedOn: new Date("2024-07-30"), submittedBy: "Nagaraj V.", details: "Asset is in ITEC, not TT as listed.", status: "In Progress" },
];

export default function FeedbackLogPage() {
  const [feedbackList, setFeedbackList] = React.useState<FeedbackItem[]>(mockFeedbackData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<AssetManagementFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { toast } = useToast();
  const form = useForm<{category: FeedbackItem['category'], details: string}>({ defaultValues: { category: "Data Issue", details: "" }});
  
  const filteredAssets = mockAssetData.filter(asset => 
    asset.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.assetDescription.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0,5);

  const handleSubmitFeedback = (data: {category: FeedbackItem['category'], details: string}) => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const newFeedback: FeedbackItem = {
            id: `FBK-${String(Date.now()).slice(-4)}`,
            assetNumber: selectedAsset.assetNumber,
            assetDescription: selectedAsset.assetDescription,
            category: data.category,
            details: data.details,
            submittedOn: new Date(),
            submittedBy: "Current User", // Mock user
            status: "Open"
        };
        setFeedbackList(prev => [newFeedback, ...prev]);
        toast({ title: "Feedback Submitted", description: `Thank you for your feedback on ${selectedAsset.assetNumber}.` });
        setSelectedAsset(null);
        form.reset();
        setIsSubmitting(false);
    }, 1000);
  };
  
  const handleStatusChange = (feedbackId: string, newStatus: FeedbackStatus) => {
    setFeedbackList(prev => prev.map(fb => fb.id === feedbackId ? {...fb, status: newStatus} : fb));
  };
  
  const getStatusBadgeVariant = (status: FeedbackStatus) => {
    if (status === "Resolved") return "default";
    if (status === "In Progress") return "secondary";
    return "outline";
  }
  
  const getStatusIcon = (status: FeedbackStatus) => {
    if (status === "Resolved") return <Check className="w-3 h-3 mr-1.5" />;
    if (status === "In Progress") return <Edit className="w-3 h-3 mr-1.5" />;
    return <Clock className="w-3 h-3 mr-1.5" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Feedback & Issue Log"
        description="Submit feedback or report issues for specific assets, and track their resolution."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Feedback</CardTitle>
              <CardDescription>Search for an asset and fill out the form to submit feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search asset by number or name..." className="pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setSelectedAsset(null); }} />
              </div>
              {!selectedAsset && searchTerm && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                    {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                        <div key={asset.id} className="p-2 hover:bg-muted cursor-pointer" onClick={() => { setSelectedAsset(asset); setSearchTerm(""); }}>
                            <p className="text-sm font-medium">{asset.assetNumber}</p>
                            <p className="text-xs text-muted-foreground">{asset.assetDescription}</p>
                        </div>
                    )) : <p className="p-4 text-center text-sm text-muted-foreground">No assets found.</p>}
                </div>
              )}
              {selectedAsset && (
                 <form onSubmit={form.handleSubmit(handleSubmitFeedback)} className="space-y-4 p-4 border rounded-md bg-muted/50">
                    <p className="text-sm font-semibold">Asset: <span className="font-normal">{selectedAsset.assetNumber}</span></p>
                    <Select onValueChange={(value) => form.setValue('category', value as FeedbackItem['category'])} defaultValue={form.getValues('category')}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Data Issue">Data Issue</SelectItem>
                        <SelectItem value="Condition">Condition</SelectItem>
                        <SelectItem value="Location Mismatch">Location Mismatch</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Provide details about the issue or feedback..." {...form.register('details', { required: "Details are required."})} />
                    {form.formState.errors.details && <p className="text-sm font-medium text-destructive">{form.formState.errors.details.message}</p>}
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Submitting...</> : <><Send className="w-4 h-4 mr-2"/>Submit Feedback</>}
                    </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Handshake className="w-5 h-5 mr-2 text-primary"/>Feedback History</CardTitle>
                    <CardDescription>Log of all submitted feedback and their current status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {feedbackList.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.assetNumber}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={item.details}>{item.details}</TableCell>
                                    <TableCell>
                                      <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value as FeedbackStatus)}>
                                          <SelectTrigger className="h-8 text-xs w-fit gap-1 pl-2 pr-1">
                                              {getStatusIcon(item.status)}
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Open"><Clock className="w-3 h-3 mr-1.5"/>Open</SelectItem>
                                            <SelectItem value="In Progress"><Edit className="w-3 h-3 mr-1.5"/>In Progress</SelectItem>
                                            <SelectItem value="Resolved"><Check className="w-3 h-3 mr-1.5"/>Resolved</SelectItem>
                                          </SelectContent>
                                      </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
