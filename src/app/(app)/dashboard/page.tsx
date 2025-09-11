// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LibraryBig, AlertTriangle, Truck, TestTube2, Recycle, HardHat, PlusCircle, BarChart3, ListChecks, Users, Clock, Package, CheckSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mockAssetData } from "@/lib/mock-asset-data";
import { allRequestsSource } from '@/lib/mock-data';
import { DEPARTMENTS, TEAMS_AND_TRIBES, ASSET_CLASSIFICATIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { SampleBarChart } from "@/components/charts/SampleBarChart";
import { SampleLineChart } from "@/components/charts/SampleLineChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";


export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedDepartment, setSelectedDepartment] = React.useState<string | undefined>(
        user?.role === 'spoc' && user.department ? user.department : undefined
    );
    const [selectedTeam, setSelectedTeam] = React.useState<string | undefined>(undefined);
    const [selectedLocation, setSelectedLocation] = React.useState<string | undefined>(undefined);
    const [selectedClassification, setSelectedClassification] = React.useState<string | undefined>(undefined);


    const filteredAssets = React.useMemo(() => {
        let assets = mockAssetData;
        if(selectedDepartment && selectedDepartment !== "all") {
            assets = assets.filter(a => a.department === selectedDepartment);
        }
        if(selectedTeam && selectedTeam !== "all") {
             assets = assets.filter(a => a.teamOrTribe === selectedTeam);
        }
        if(selectedLocation && selectedLocation !== "all") {
            assets = assets.filter(a => a.location === selectedLocation);
        }
        if(selectedClassification && selectedClassification !== "all") {
            assets = assets.filter(a => a.assetClassification === selectedClassification);
        }
        return assets;
    }, [selectedDepartment, selectedTeam, selectedLocation, selectedClassification]);


    const kpiCards = React.useMemo(() => {
        const totalAssets = filteredAssets.length;
        const inUse = filteredAssets.filter(a => a.currentStatus === 'In Use').length;
        const inStore = filteredAssets.filter(a => a.currentStatus === 'In Store').length;
        const calibration = filteredAssets.filter(a => a.currentStatus === 'Calibration').length;
        const scrapped = filteredAssets.filter(a => a.currentStatus === 'Scrapped').length;
        const verificationDue = filteredAssets.filter(a => a.verificationStatus === 'Pending').length;
        const overdueReturns = 5; 

        return [
            { title: "Total Assets", value: totalAssets, icon: LibraryBig, color: "text-primary", href: "/asset-management/list" },
            { title: "Assets in Use", value: inUse, icon: HardHat, color: "text-green-500", href: "/asset-management/list" },
            { title: "Assets Available", value: inStore, icon: CheckSquare, color: "text-blue-500", href: "/asset-management/list" },
            { title: "In Calibration", value: calibration, icon: TestTube2, color: "text-cyan-500", href: "/asset-management/list" },
            { title: "Scrapped Assets", value: scrapped, icon: Recycle, color: "text-gray-500", href: "/reports/scrap-report" },
            { title: "Verification Due", value: verificationDue, icon: AlertTriangle, color: "text-yellow-500", href: "/asset-transactions/audit" },
            { title: "Overdue Returns", value: overdueReturns, icon: Clock, color: "text-destructive", href: "/reports/exceptions/overdue-returns" },
        ];
    }, [filteredAssets]);

    const assetDistByCategory = React.useMemo(() => {
         const categoryCounts = filteredAssets.reduce((acc, asset) => {
            const category = asset.assetClassification || "Unclassified";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    }, [filteredAssets]);

     const assetDistByDept = React.useMemo(() => {
         const deptCounts = filteredAssets.reduce((acc, asset) => {
            const dept = asset.department || "Unassigned";
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
    }, [filteredAssets]);
    
    const recentMovementsData = [
        { month: "Jan", "TT <> ITEC": 10, "ITEC -> Site": 5, "Calibration": 2, "Scrap": 1 },
        { month: "Feb", "TT <> ITEC": 12, "ITEC -> Site": 7, "Calibration": 3, "Scrap": 0 },
        { month: "Mar", "TT <> ITEC": 8, "ITEC -> Site": 10, "Calibration": 1, "Scrap": 2 },
        { month: "Apr", "TT <> ITEC": 15, "ITEC -> Site": 8, "Calibration": 4, "Scrap": 1 },
        { month: "May", "TT <> ITEC": 11, "ITEC -> Site": 12, "Calibration": 2, "Scrap": 3 },
        { month: "Jun", "TT <> ITEC": 14, "ITEC -> Site": 9, "Calibration": 5, "Scrap": 1 },
    ];

    const pendingRequests = allRequestsSource.filter(r => !r.isVoided && r.currentAssignees.length > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Management Dashboard"
        description="A role-based overview of asset status, movements, and key alerts."
      />

       <Card>
            <CardHeader>
                <CardTitle>Global Filters</CardTitle>
                <CardDescription>Filter all dashboard widgets by organizational structure, location, or asset type.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {user?.role === 'admin' && (
                    <Select value={selectedDepartment} onValueChange={e => setSelectedDepartment(e === 'all' ? undefined : e)}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Departments</SelectItem>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                    </Select>
                )}
                 <Select value={selectedTeam} onValueChange={e => setSelectedTeam(e === 'all' ? undefined : e)}>
                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Team/Tribe" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Teams/Tribes</SelectItem>{TEAMS_AND_TRIBES.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedClassification} onValueChange={e => setSelectedClassification(e === 'all' ? undefined : e)}>
                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Classification" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Classifications</SelectItem>{ASSET_CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {kpiCards.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  </CardContent>
              </Card>
            </Link>
            ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <SampleBarChart data={assetDistByCategory} title="Asset Distribution by Category" dataKeyX="name" dataKeyY="value" />
            <SampleBarChart data={assetDistByDept} title="Asset Distribution by Department" dataKeyX="name" dataKeyY="value" fillColor="hsl(var(--accent))" />
        </div>
         <div className="grid gap-6 lg:grid-cols-1">
            <SampleLineChart data={recentMovementsData} title="Recent Asset Movements by Type" description="Total movements over the last 6 months." dataKeyX="month" dataKeyY={["TT <> ITEC", "ITEC -> Site", "Calibration", "Scrap"]} />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><Clock className="w-5 h-5 mr-2 text-primary"/>Pending Requests</CardTitle>
                <CardDescription>All requests across modules awaiting action.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Requester</TableHead><TableHead>Current Step</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {pendingRequests.slice(0,5).map(req => (
                            <TableRow key={req.id}>
                                <TableCell><Button variant="link" size="sm" className="p-0 h-auto font-medium" onClick={() => router.push('/all-requests')}>{req.id}</Button></TableCell>
                                <TableCell>{req.requestType}</TableCell>
                                <TableCell>{req.requesterName}</TableCell>
                                <TableCell><Badge variant="secondary">{req.currentStepName}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableCaption>{pendingRequests.length > 5 && `And ${pendingRequests.length - 5} more...`}</TableCaption>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-500"/>Alerts & Exceptions</CardTitle>
                <CardDescription>Key items requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between p-2 rounded-md bg-muted/50"><span>Assets due for return: <strong>5</strong></span><Button variant="link" size="sm" onClick={() => router.push('/reports/exceptions/overdue-returns')}>View</Button></li>
                    <li className="flex items-center justify-between p-2 rounded-md bg-muted/50"><span>Assets with expiring warranty: <strong>2</strong></span><Button variant="link" size="sm" onClick={() => router.push('/reports/audit/warranty-amc')}>View</Button></li>
                    <li className="flex items-center justify-between p-2 rounded-md bg-muted/50"><span>Assets with incomplete data: <strong>8</strong></span><Button variant="link" size="sm" onClick={() => router.push('/reports/exceptions/incomplete-records')}>View</Button></li>
                    <li className="flex items-center justify-between p-2 rounded-md bg-muted/50"><span>Assets needing repair: <strong>3</strong></span><Button variant="link" size="sm" onClick={() => router.push('/reports/exceptions/condition-exceptions')}>View</Button></li>
                </ul>
            </CardContent>
        </Card>
      
    </div>
  );
}
