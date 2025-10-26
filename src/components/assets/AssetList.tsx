'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  ArrowUpDown,
  Download,
  Plus,
  Loader2
} from 'lucide-react'
import { AssetData } from '@/types/asset'
import { usePermissions } from '@/hooks/usePermissions'
import { useAssetListUpdates } from '@/hooks/useAssetUpdates'

interface AssetListProps {
  onCreateAsset: () => void
  onEditAsset: (asset: AssetData) => void
  onViewAsset: (asset: AssetData) => void
}

interface AssetFilters {
  search: string
  department: string
  status: string
  classification: string
  location: string
}

export function AssetList({ onCreateAsset, onEditAsset, onViewAsset }: AssetListProps) {
  const [assets, setAssets] = useState<AssetData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AssetFilters>({
    search: '',
    department: '',
    status: '',
    classification: '',
    location: ''
  })
  const [sortField, setSortField] = useState<keyof AssetData>('assetNumber')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAssets, setTotalAssets] = useState(0)
  const [masterData, setMasterData] = useState<{
    departments: string[]
    statuses: string[]
    classifications: string[]
    locations: string[]
  }>({
    departments: [],
    statuses: [],
    classifications: [],
    locations: []
  })

  const { canCreate, canEdit, canDelete } = usePermissions()

  // Load master data for filters
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [deptRes, statusRes, classRes, locRes] = await Promise.all([
          fetch('/api/masters/departments'),
          fetch('/api/masters/asset-statuses'),
          fetch('/api/masters/asset-classifications'),
          fetch('/api/masters/locations')
        ])

        const [departments, statuses, classifications, locations] = await Promise.all([
          deptRes.json(),
          statusRes.json(),
          classRes.json(),
          locRes.json()
        ])

        setMasterData({
          departments: departments.data?.entries || [],
          statuses: statuses.data?.entries || [],
          classifications: classifications.data?.entries || [],
          locations: locations.data?.entries || []
        })
      } catch (error) {
        console.error('Failed to load master data:', error)
      }
    }

    loadMasterData()
  }, [])

  // Load assets
  useEffect(() => {
    loadAssets()
  }, [filters, sortField, sortDirection, currentPage])

  // Set up real-time updates
  const { isConnected } = useAssetListUpdates(() => {
    // Refresh the asset list when updates are received
    loadAssets()
  })

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortField,
        sortDirection,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/assets?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load assets')
      }

      const data = await response.json()
      
      if (data.success) {
        setAssets(data.data.assets)
        setTotalPages(data.data.totalPages)
        setTotalAssets(data.data.total)
      } else {
        throw new Error(data.message || 'Failed to load assets')
      }
    } catch (error) {
      console.error('Error loading assets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof AssetData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (key: keyof AssetFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      status: '',
      classification: '',
      location: ''
    })
    setCurrentPage(1)
  }

  const exportAssets = async () => {
    try {
      const params = new URLSearchParams({
        format: 'excel',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/assets/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to export assets')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assets-export-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting assets:', error)
      setError('Failed to export assets')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'disposed':
        return 'destructive'
      case 'under maintenance':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getVerificationBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'default'
      case 'pending':
        return 'outline'
      case 'discrepancy':
        return 'destructive'
      case 'overdue':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Manage and track your organization's assets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Real-time connection indicator */}
          <div className="flex items-center space-x-1 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button variant="outline" onClick={exportAssets}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {canCreate('assets') && (
            <Button onClick={onCreateAsset}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select
                value={filters.department}
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {masterData.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {masterData.statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Classification</label>
              <Select
                value={filters.classification}
                onValueChange={(value) => handleFilterChange('classification', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classifications</SelectItem>
                  {masterData.classifications.map((classification) => (
                    <SelectItem key={classification} value={classification}>{classification}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={filters.location}
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {masterData.locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Assets ({totalAssets} total)
            </CardTitle>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('assetNumber')}
                      className="h-auto p-0 font-semibold"
                    >
                      Asset Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('assetDescription')}
                      className="h-auto p-0 font-semibold"
                    >
                      Description
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('purchaseValue')}
                      className="h-auto p-0 font-semibold"
                    >
                      Value
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-muted-foreground">Loading assets...</p>
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No assets found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.assetNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.assetDescription}</p>
                          {asset.brandName && asset.modelNo && (
                            <p className="text-sm text-muted-foreground">
                              {asset.brandName} {asset.modelNo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{asset.department}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(asset.currentStatus)}>
                          {asset.currentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getVerificationBadgeVariant(asset.verificationStatus)}>
                          {asset.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.purchaseValue ? (
                          `₹${asset.purchaseValue.toLocaleString()}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewAsset(asset)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canEdit('assets') && (
                              <DropdownMenuItem onClick={() => onEditAsset(asset)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Asset
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}