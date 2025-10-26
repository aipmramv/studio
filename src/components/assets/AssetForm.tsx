'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X } from 'lucide-react'
import { AssetData } from '@/types/asset'

const assetSchema = z.object({
  assetDescription: z.string().min(1, 'Asset description is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  currentStatus: z.string().min(1, 'Status is required'),
  assetClassification: z.string().min(1, 'Classification is required'),
  assetGrouping: z.string().optional(),
  brandName: z.string().optional(),
  modelNo: z.string().optional(),
  productSerialNo: z.string().optional(),
  purchaseValue: z.number().min(0).optional(),
  ledgerQty: z.number().min(1, 'Quantity must be at least 1'),
  capitalizationDate: z.string().optional(),
  lifecycleYears: z.number().min(1).max(50).optional(),
  warrantyExpiryDate: z.string().optional(),
})

type AssetFormData = z.infer<typeof assetSchema>

interface AssetFormProps {
  asset?: AssetData
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function AssetForm({ asset, onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const [masterData, setMasterData] = useState<{
    departments: string[]
    locations: string[]
    statuses: string[]
    classifications: string[]
    groupings: string[]
  }>({
    departments: [],
    locations: [],
    statuses: [],
    classifications: [],
    groupings: []
  })
  const [loadingMasterData, setLoadingMasterData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset ? {
      assetDescription: asset.assetDescription,
      department: asset.department,
      location: asset.location,
      currentStatus: asset.currentStatus,
      assetClassification: asset.assetClassification,
      assetGrouping: asset.assetGrouping,
      brandName: asset.brandName,
      modelNo: asset.modelNo,
      productSerialNo: asset.productSerialNo,
      purchaseValue: asset.purchaseValue,
      ledgerQty: asset.ledgerQty || 1,
      capitalizationDate: asset.capitalizationDate ? new Date(asset.capitalizationDate).toISOString().split('T')[0] : '',
      lifecycleYears: asset.lifecycleYears,
      warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate).toISOString().split('T')[0] : '',
    } : {
      ledgerQty: 1
    }
  })

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [deptRes, locRes, statusRes, classRes, groupRes] = await Promise.all([
          fetch('/api/masters/departments'),
          fetch('/api/masters/locations'),
          fetch('/api/masters/asset-statuses'),
          fetch('/api/masters/asset-classifications'),
          fetch('/api/masters/asset-groupings')
        ])

        const [departments, locations, statuses, classifications, groupings] = await Promise.all([
          deptRes.json(),
          locRes.json(),
          statusRes.json(),
          classRes.json(),
          groupRes.json()
        ])

        setMasterData({
          departments: departments.data?.entries || [],
          locations: locations.data?.entries || [],
          statuses: statuses.data?.entries || [],
          classifications: classifications.data?.entries || [],
          groupings: groupings.data?.entries || []
        })
      } catch (error) {
        console.error('Failed to load master data:', error)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setLoadingMasterData(false)
      }
    }

    loadMasterData()
  }, [])

  const onFormSubmit = async (data: AssetFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while saving the asset')
    }
  }

  if (loadingMasterData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading form data...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{asset ? 'Edit Asset' : 'Create New Asset'}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetDescription">Asset Description *</Label>
              <Input
                id="assetDescription"
                {...register('assetDescription')}
                placeholder="Enter asset description"
              />
              {errors.assetDescription && (
                <p className="text-sm text-red-600">{errors.assetDescription.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select onValueChange={(value) => setValue('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {masterData.departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-red-600">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select onValueChange={(value) => setValue('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {masterData.locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStatus">Status *</Label>
              <Select onValueChange={(value) => setValue('currentStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {masterData.statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currentStatus && (
                <p className="text-sm text-red-600">{errors.currentStatus.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetClassification">Classification *</Label>
              <Select onValueChange={(value) => setValue('assetClassification', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  {masterData.classifications.map((classification) => (
                    <SelectItem key={classification} value={classification}>{classification}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assetClassification && (
                <p className="text-sm text-red-600">{errors.assetClassification.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetGrouping">Grouping</Label>
              <Select onValueChange={(value) => setValue('assetGrouping', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {masterData.groupings.map((grouping) => (
                    <SelectItem key={grouping} value={grouping}>{grouping}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                {...register('brandName')}
                placeholder="Enter brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelNo">Model Number</Label>
              <Input
                id="modelNo"
                {...register('modelNo')}
                placeholder="Enter model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productSerialNo">Serial Number</Label>
              <Input
                id="productSerialNo"
                {...register('productSerialNo')}
                placeholder="Enter serial number"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseValue">Purchase Value</Label>
              <Input
                id="purchaseValue"
                type="number"
                step="0.01"
                {...register('purchaseValue', { valueAsNumber: true })}
                placeholder="Enter purchase value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ledgerQty">Quantity *</Label>
              <Input
                id="ledgerQty"
                type="number"
                min="1"
                {...register('ledgerQty', { valueAsNumber: true })}
                placeholder="Enter quantity"
              />
              {errors.ledgerQty && (
                <p className="text-sm text-red-600">{errors.ledgerQty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifecycleYears">Lifecycle (Years)</Label>
              <Input
                id="lifecycleYears"
                type="number"
                min="1"
                max="50"
                {...register('lifecycleYears', { valueAsNumber: true })}
                placeholder="Enter lifecycle years"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capitalizationDate">Capitalization Date</Label>
              <Input
                id="capitalizationDate"
                type="date"
                {...register('capitalizationDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiryDate">Warranty Expiry Date</Label>
              <Input
                id="warrantyExpiryDate"
                type="date"
                {...register('warrantyExpiryDate')}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {asset ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}