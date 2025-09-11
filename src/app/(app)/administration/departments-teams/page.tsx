// src/app/(app)/administration/departments-teams/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Building, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DEPARTMENTS, TEAMS_AND_TRIBES } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function DepartmentsTeamsMasterPage() {
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Departments, Teams & Tribes Master"
        description="Manage organizational structure for ownership & reporting."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New
          </Button>
        }
      />
      <Tabs defaultValue="departments">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departments"><Building className="mr-2"/>Departments</TabsTrigger>
            <TabsTrigger value="teams"><Users className="mr-2"/>Teams & Tribes</TabsTrigger>
        </TabsList>
        <TabsContent value="departments">
            <Card>
                <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Drives role-based access and departmental visibility.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {DEPARTMENTS.map((dept) => (
                        <TableRow key={dept}><TableCell className="font-medium">{dept}</TableCell>
                            <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                            <Button variant="destructive" size="sm"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableCaption>{DEPARTMENTS.length} department(s) found.</TableCaption>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="teams">
             <Card>
                <CardHeader>
                <CardTitle>Teams & Tribes</CardTitle>
                <CardDescription>Used for team-specific dashboards and asset allocation.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {TEAMS_AND_TRIBES.map((team) => (
                        <TableRow key={team}><TableCell className="font-medium">{team}</TableCell>
                            <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                            <Button variant="destructive" size="sm"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableCaption>{TEAMS_AND_TRIBES.length} team(s)/tribe(s) found.</TableCaption>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
