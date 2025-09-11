
// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LibraryBig, AlertTriangle, Truck, TestTube2, Recycle, HardHat, PlusCircle, Link, BarChart3, ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mockAssetData } from "@/lib/mock-asset-data";
import { DEPARTMENTS, TEAMS_AND_TRIBES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";


export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedDepartment, setSelectedDepartment] = React.useState<string | undefined>(
        user?.role === 'spoc' && user.department ? user.department : undefined
    );
    const [selectedTeam, setSelectedTeam] = React.useState<string | undefined>(undefined);

    const summaryCards = React.useMemo(() => {
        let filteredAssets = mockAssetData;
        if(selectedDepartment && selectedDepartment !== "all") {
            filteredAssets = filteredAssets.filter(a => a.department === selectedDepartment);
        }
        if(selectedTeam && selectedTeam !== "all") {
             filteredAssets = filteredAssets.filter(a => a.teamOrTribe === selectedTeam);
        }

        const totalAssets = filteredAssets.length;
        const verificationPending = filteredAssets.filter(a => a.verificationStatus === 'Pending').length;
        const calibrationDue = filteredAssets.filter(a => a.currentStatus === 'Calibration').length;
        const scrapped = filteredAssets.filter(a => a.currentStatus === 'Scrapped').length;
        const active = filteredAssets.filter(a => a.currentStatus === 'Active' || a.currentStatus === 'In Use').length;

        return [
            { title: "Total Assets", value: totalAssets, icon: LibraryBig, color: "text-primary" },
            { title: "Active/In Use", value: active, icon: HardHat, color: "text-green-500" },
            { title: "Verification Pending", value: verificationPending, icon: AlertTriangle, color: "text-yellow-500" },
            { title: "Calibration Due", value: calibrationDue, icon: TestTube2, color: "text-orange-500" },
            { title: "Scrapped", value: scrapped, icon: Recycle, color: "text-destructive" },
        ];
    }, [selectedDepartment, selectedTeam]);

    const quickLinks = [
        { title: "Create New Asset", href: "/asset-management/list", icon: PlusCircle }, // Assuming creation is on list page
        { title: "Initiate Transfer", href: "/transactions/transfers", icon: Truck },
        { title: "View All Reports", href: "/reports", icon: BarChart3 },
        { title: "Start New Audit", href: "/transactions/audit", icon: ListChecks },
    ];


  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Management Dashboard"
        description="A role-based overview of asset status, movements, and key alerts."
      />

       <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter the dashboard summary cards by department or team.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                {user?.role === 'admin' && (
                    <Select value={selectedDepartment} onValueChange={e => setSelectedDepartment(e === 'all' ? undefined : e)}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Departments</SelectItem>
                            {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
                 <Select value={selectedTeam} onValueChange={e => setSelectedTeam(e === 'all' ? undefined : e)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select Team/Tribe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Teams/Tribes</SelectItem>
                        {TEAMS_AND_TRIBES.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {summaryCards.map((stat, index) => (
            <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
            </Card>
            ))}
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Quickly access common asset management tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map(link => (
                    <Button key={link.title} variant="outline" className="h-20 flex-col gap-2" onClick={() => router.push(link.href)}>
                        <link.icon className="w-6 h-6 text-primary"/>
                        <span>{link.title}</span>
                    </Button>
                ))}
            </CardContent>
        </Card>
      
    </div>
  );
}
