'use client'

import React, { useState } from 'react'
import { WorkflowList } from '@/components/workflows/WorkflowList'
import { WorkflowDetails } from '@/components/workflows/WorkflowDetails'
import { ApprovalDashboard } from '@/components/workflows/ApprovalDashboard'
import { WorkflowInstance } from '@/types/workflow'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, FileText, BarChart3 } from 'lucide-react'

type ViewMode = 'dashboard' | 'list' | 'details'

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleViewWorkflow = (workflow: WorkflowInstance) => {
    setSelectedWorkflow(workflow)
    setViewMode('details')
  }

  const handleApproveWorkflow = (workflow: WorkflowInstance) => {
    // Handle workflow approval - could show success message or refresh data
    console.log('Workflow approved:', workflow.id)
  }

  const handleRejectWorkflow = (workflow: WorkflowInstance) => {
    // Handle workflow rejection - could show success message or refresh data
    console.log('Workflow rejected:', workflow.id)
  }

  const handleWorkflowUpdated = (workflow: WorkflowInstance) => {
    // Handle workflow update - could refresh lists or show notifications
    console.log('Workflow updated:', workflow.id)
    setSelectedWorkflow(workflow)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedWorkflow(null)
    setActiveTab('list')
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setSelectedWorkflow(null)
    setActiveTab('dashboard')
  }

  if (viewMode === 'details' && selectedWorkflow) {
    return (
      <div className="container mx-auto py-6">
        <WorkflowDetails
          workflowId={selectedWorkflow.id}
          onClose={handleBackToList}
          onWorkflowUpdated={handleWorkflowUpdated}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="dashboard" 
            onClick={() => setViewMode('dashboard')}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            onClick={() => setViewMode('dashboard')}
            className="flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>My Approvals</span>
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>All Workflows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ApprovalDashboard />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalDashboard />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <WorkflowList
            onViewWorkflow={handleViewWorkflow}
            onApproveWorkflow={handleApproveWorkflow}
            onRejectWorkflow={handleRejectWorkflow}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}