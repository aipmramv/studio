'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Upload,
  Download,
  Database,
  Building,
  MapPin,
  Tag,
  Package,
  CheckCircle,
  Loader2,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface MasterDataEntry {
  id: string
  value: string
  description?: string
  isActive: boolean
  order?: number
  createdAt: Date
  updatedAt: Date
}

interface MasterDataType {
  id: string
  name: string
  displayName: string
  description: string
  icon: React.ReactNode
  entries: MasterDataEntry[]
  allowCustomEntries: boolean
  isSystemManaged: boolean
}

const masterDataTypes: Omit<MasterDataType, 'entries'>[] = [
  {
    id: 'departments',
    name: 'departments',
    displayName: 'Departments',
    description: 'Organizational departments',
    icon: <Building className="h-4 w-4" />,
    allowCustomEntries: true,
    isSystemManaged: false
  },
  {
    id: 'locations',
    name: 'locations',
    displayName: 'Locations',
    description: 'Physical locations and sites',
    icon: <MapPin className="h-4 w-4" />,
    allowCustomEntries: true,
    isSystemManaged: false
  },
  {
    id: 'asset-statuses',
    name: 'asset-statuses',
    displayName: 'Asset Statuses',
    description: 'Asset lifecycle statuses',
    icon: <CheckCircle className="h-4 w-4" />,
    allowCustomEntries: false,
    isSystemManaged: true
  },
  {
    id: 'asset-classifications',
    name: 'asset-classifications',
    displayName: 'Asset Classifications',
    description: 'Asset category classifications',
    icon: <Tag className="h-4 w-4" />,
    allowCustomEntries: true,
    isSystemManaged: false
  },
  {
    id: 'asset-groupings',
    name: 'asset-groupings',
    displayName: 'Asset Groupings',
    description: 'Asset sub-category groupings',
    icon: <Package className="h-4 w-4" />,
    allowCustomEntries: true,
    isSystemManaged: false
  }
]

export function MasterDataManagement() {
  const [masterData, setMasterData] = useState<MasterDataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('departments')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MasterDataEntry | null>(null)
  const [currentDataType, setCurrentDataType] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    value: '',
    description: '',
    isActive: true,
    order: 0
  })

  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      setLoading(true)
      setError(null)

      const promises = masterDataTypes.map(async (type) => {
        const response = await fetch(`/api/masters/${type.name}`)
        if (response.ok) {
          const data = await response.json()
          return {
            ...type,
            entries: data.success ? (data.data.entries || []).map((entry: any, index: number) => ({
              id: `${type.name}-${index}`,
              value: typeof entry === 'string' ? entry : entry.value,
              description: typeof entry === 'object' ? entry.description : '',
              isActive: typeof entry === 'object' ? entry.isActive !== false : true,
              order: typeof entry === 'object' ? entry.order || index : index,
              createdAt: new Date(),
              updatedAt: new Date()
            })) : []
          }
        }
        return { ...type, entries: [] }
      })

      const results = await Promise.all(promises)
      setMasterData(results)
    } catch (error) {
      console.error('Error loading master data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load master data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = (dataType: string) => {
    setCurrentDataType(dataType)
    setEditingEntry(null)
    setFormData({
      value: '',
      description: '',
      isActive: true,
      order: 0
    })
    setIsDialogOpen(true)
  }

  const handleEditEntry = (dataType: string, entry: MasterDataEntry) => {
    setCurrentDataType(dataType)
    setEditingEntry(entry)
    setFormData({
      value: entry.value,
      description: entry.description || '',
      isActive: entry.isActive,
      order: entry.order || 0
    })
    setIsDialogOpen(true)
  }

  const handleSubmitEntry = async () => {
    if (!formData.value.trim()) {
      toast.error('Value is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const url = editingEntry 
        ? `/api/masters/${currentDataType}/entries/${editingEntry.id}`
        : `/api/masters/${currentDataType}/entries`
      
      const method = editingEntry ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${editingEntry ? 'update' : 'create'} entry`)
      }

      if (result.success) {
        toast.success(`Entry ${editingEntry ? 'updated' : 'created'} successfully`)
        setIsDialogOpen(false)
        loadMasterData()
      } else {
        throw new Error(result.message || `Failed to ${editingEntry ? 'update' : 'create'} entry`)
      }
    } catch (error) {
      console.error('Error submitting entry:', error)
      setError(error instanceof Error ? error.message : 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEntry = async (dataType: string, entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/masters/${dataType}/entries/${entryId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete entry')
      }

      if (result.success) {
        toast.success('Entry deleted successfully')
        loadMasterData()
      } else {
        throw new Error(result.message || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const handleToggleEntryStatus = async (dataType: string, entryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/masters/${dataType}/entries/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update entry status')
      }

      if (result.success) {
        toast.success(`Entry ${isActive ? 'activated' : 'deactivated'} successfully`)
        loadMasterData()
      } else {
        throw new Error(result.message || 'Failed to update entry status')
      }
    } catch (error) {
      console.error('Error updating entry status:', error)
      toast.error('Failed to update entry status')
    }
  }

  const handleImportData = async (dataType: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/masters/${dataType}/import`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to import data')
      }

      if (result.success) {
        toast.success(`Imported ${result.data.imported} entries successfully`)
        loadMasterData()
      } else {
        throw new Error(result.message || 'Failed to import data')
      }
    } catch (error) {
      console.error('Error importing data:', error)
      toast.error('Failed to import data')
    }
  }

  const handleExportData = async (dataType: string) => {
    try {
      const response = await fetch(`/api/masters/${dataType}/export`)
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const getCurrentDataType = () => {
    return masterData.find(type => type.name === activeTab)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading master data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Master Data Management</h2>
          <p className="text-muted-foreground">
            Manage system reference data and lookup values
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
        <TabsList className="grid w-full grid-cols-5">
          {masterDataTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.name} className="flex items-center space-x-2">
              {type.icon}
              <span className="hidden sm:inline">{type.displayName}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {masterDataTypes.map((type) => {
          const currentType = masterData.find(t => t.name === type.name)
          const entries = currentType?.entries || []

          return (
            <TabsContent key={type.id} value={type.name} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {type.icon}
                        <span>{type.displayName}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImportData(type.name, file)
                          }
                        }}
                        className="hidden"
                        id={`import-${type.name}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`import-${type.name}`)?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportData(type.name)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      {type.allowCustomEntries && (
                        <Button
                          size="sm"
                          onClick={() => handleAddEntry(type.name)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Entry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {entries.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No entries found</p>
                      <p className="text-muted-foreground">
                        {type.allowCustomEntries 
                          ? 'Add your first entry to get started'
                          : 'This data is system managed'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {entries
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium">{entry.value}</p>
                                {entry.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={entry.isActive ? 'default' : 'secondary'}>
                                {entry.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {type.allowCustomEntries && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => handleEditEntry(type.name, entry)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Entry
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleToggleEntryStatus(
                                        type.name, 
                                        entry.id, 
                                        !entry.isActive
                                      )}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      {entry.isActive ? 'Deactivate' : 'Activate'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteEntry(type.name, entry.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Entry
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Entry Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Entry' : 'Add New Entry'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry 
                ? 'Update the entry information.' 
                : `Add a new entry to ${getCurrentDataType()?.displayName || 'the selected data type'}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active entry</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEntry} disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingEntry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}