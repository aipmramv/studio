'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  ArrowLeftRight,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  Trash2
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'assets' | 'financial' | 'movements' | 'verification' | 'workflows'
  type: 'standard' | 'custom'
  parameters: ReportParameter[]
  lastGenerated?: Date
  generatedCount: number
}

interface ReportParameter {
  id: string
  name: string
  type: 'text' | 'select' | 'date' | 'daterange' | 'boolean' | 'multiselect'
  label: string
  required: boolean
  options?: string[]
  defaultValue?: any
}

interface GeneratedReport {
  id: string
  templateId: string
  templateName: string
  name: string
  status: 'generating' | 'completed' | 'failed'
  format: 'pdf' | 'excel' | 'csv'
  parameters: Record<string, any>
  generatedAt: Date
  generatedBy: string
  fileSize?: number
  downloadUrl?: string
  expiresAt?: Date
}

interface ReportFilters {
  startDate: string
  endDate: string
  departments: string[]
  statuses: string[]
  classifications: string[]
  includeHistory: boolean
  includeImages: boolean
  groupBy: string
  sortBy: string
  format: 'pdf' | 'excel' | 'csv'
}

export function ReportsInterface() {
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    departments: [],
    statuses: [],
    classifications: [],
    includeHistory: false,
    includeImages: false,
    groupBy: 'department',
    sortBy: 'assetNumber',
    format: 'excel'
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('templates')
  const [masterData, setMasterData] = useState<{
    departments: string[]
    statuses: string[]
    classifications: string[]
  }>({
    departments: [],
    statuses: [],
    classifications: []
  })

  const { canGenerateReports, canViewReports } = usePermissions()

  useEffect(() => {
    loadReportData()
    loadMasterData()
  }, [])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [templatesRes, reportsRes] = await Promise.all([
        fetch('/api/reports/templates'),
        fetch('/api/reports/generated?limit=20')
      ])

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        if (templatesData.success) {
          setReportTemplates(templatesData.data.templates || [])
        }
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        if (reportsData.success) {
          setGeneratedReports(reportsData.data.reports || [])
        }
      }
    } catch (error) {
      console.error('Error loading report data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const loadMasterData = async () => {
    try {
      const [deptRes, statusRes, classRes] = await Promise.all([
        fetch('/api/masters/departments'),
        fetch('/api/masters/asset-statuses'),
        fetch('/api/masters/asset-classifications')
      ])

      const [departments, statuses, classifications] = await Promise.all([
        deptRes.json(),
        statusRes.json(),
        classRes.json()
      ])

      setMasterData({
        departments: departments.data?.entries || [],
        statuses: statuses.data?.entries || [],
        classifications: classifications.data?.entries || []
      })
    } catch (error) {
      console.error('Failed to load master data:', error)
    }
  }

  const handleGenerateReport = async (template: ReportTemplate) => {
    if (!canGenerateReports) {
      toast.error('You do not have permission to generate reports')
      return
    }

    try {
      setGenerating(true)
      setError(null)

      const reportData = {
        templateId: template.id,
        parameters: reportFilters,
        format: reportFilters.format,
        name: `${template.name} - ${new Date().toLocaleDateString()}`
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to generate report')
      }

      if (result.success) {
        toast.success('Report generation started')
        
        // Refresh the generated reports list
        loadReportData()
        
        // Switch to generated reports tab
        setActiveTab('generated')
      } else {
        throw new Error(result.message || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate report')
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      const response = await fetch(`/api/reports/generated/${report.id}/download`)
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.name}.${report.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/generated/${reportId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Report deleted successfully')
        loadReportData()
      } else {
        throw new Error(result.message || 'Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete report')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assets':
        return <Package className="h-4 w-4" />
      case 'financial':
        return <DollarSign className="h-4 w-4" />
      case 'movements':
        return <ArrowLeftRight className="h-4 w-4" />
      case 'verification':
        return <CheckCircle className="h-4 w-4" />
      case 'workflows':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'generating':
        return 'outline'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage asset reports and analytics
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Report Templates
          </TabsTrigger>
          <TabsTrigger value="generate">
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger value="generated">
            <Download className="mr-2 h-4 w-4" />
            Generated Reports
            {generatedReports.filter(r => r.status === 'generating').length > 0 && (
              <Badge variant="outline" className="ml-2">
                {generatedReports.filter(r => r.status === 'generating').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getCategoryIcon(template.category)}
                    <span>{template.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {template.category.toUpperCase()}
                    </Badge>
                    <Badge variant={template.type === 'standard' ? 'default' : 'secondary'}>
                      {template.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Generated {template.generatedCount} times</span>
                    {template.lastGenerated && (
                      <span>Last: {formatDate(template.lastGenerated)}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setActiveTab('generate')
                      }}
                      disabled={!canGenerateReports}
                    >
                      <BarChart3 className="mr-1 h-3 w-3" />
                      Generate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          {selectedTemplate ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Configuration */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getCategoryIcon(selectedTemplate.category)}
                      <span>{selectedTemplate.name}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Departments</Label>
                        <Select
                          value={reportFilters.departments.join(',')}
                          onValueChange={(value) => setReportFilters(prev => ({ 
                            ...prev, 
                            departments: value ? value.split(',') : [] 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select departments" />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Asset Status</Label>
                        <Select
                          value={reportFilters.statuses.join(',')}
                          onValueChange={(value) => setReportFilters(prev => ({ 
                            ...prev, 
                            statuses: value ? value.split(',') : [] 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.statuses.map((status) => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeHistory"
                          checked={reportFilters.includeHistory}
                          onCheckedChange={(checked) => setReportFilters(prev => ({ 
                            ...prev, 
                            includeHistory: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="includeHistory">Include asset history</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeImages"
                          checked={reportFilters.includeImages}
                          onCheckedChange={(checked) => setReportFilters(prev => ({ 
                            ...prev, 
                            includeImages: checked as boolean 
                          }))}
                        />
                        <Label htmlFor="includeImages">Include asset images</Label>
                      </div>
                    </div>

                    {/* Format and Grouping */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Group By</Label>
                        <Select
                          value={reportFilters.groupBy}
                          onValueChange={(value) => setReportFilters(prev => ({ ...prev, groupBy: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="department">Department</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                            <SelectItem value="classification">Classification</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                          value={reportFilters.format}
                          onValueChange={(value: any) => setReportFilters(prev => ({ ...prev, format: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                            <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                            <SelectItem value="csv">CSV (.csv)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview and Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Report Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Template:</span>
                        <span>{selectedTemplate.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{selectedTemplate.category.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{reportFilters.format.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Range:</span>
                        <span>
                          {reportFilters.startDate && reportFilters.endDate
                            ? `${reportFilters.startDate} to ${reportFilters.endDate}`
                            : 'All dates'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button
                        onClick={() => handleGenerateReport(selectedTemplate)}
                        disabled={generating}
                        className="w-full"
                      >
                        {generating && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Download className="mr-2 h-4 w-4" />
                        Generate Report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTemplate(null)}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a Report Template</p>
                <p className="text-muted-foreground">
                  Choose a template from the Templates tab to start generating a report
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab('templates')}
                >
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generated">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No Reports Generated</p>
                  <p className="text-muted-foreground">
                    Generate your first report to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{report.name}</h4>
                          <Badge variant={getStatusBadgeVariant(report.status)}>
                            {report.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {report.templateName} • {report.format.toUpperCase()}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Generated {formatDate(report.generatedAt)}</span>
                          <span>by {report.generatedBy}</span>
                          {report.fileSize && <span>{formatFileSize(report.fileSize)}</span>}
                          {report.expiresAt && (
                            <span>Expires {formatDate(report.expiresAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {report.status === 'generating' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        {report.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}