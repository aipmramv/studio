'use client'

import React, { useState } from 'react'
import { MainDashboard } from '@/components/dashboard/MainDashboard'
import { ReportsInterface } from '@/components/reports/ReportsInterface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, FileText } from 'lucide-react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <MainDashboard />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportsInterface />
        </TabsContent>
      </Tabs>
    </div>
  )
}