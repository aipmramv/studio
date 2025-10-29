'use client'

import React, { useState } from 'react'
import { AssetList } from '@/components/assets/AssetList'
import { AssetForm } from '@/components/assets/AssetForm'
import { AssetDetails } from '@/components/assets/AssetDetails'
import { AssetData, AssetCreateRequest, AssetUpdateRequest } from '@/types/asset'
import { toast } from 'sonner'

type ViewMode = 'list' | 'create' | 'edit' | 'details'

export default function AssetsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAsset = () => {
    setSelectedAsset(null)
    setViewMode('create')
  }

  const handleEditAsset = (asset: AssetData) => {
    setSelectedAsset(asset)
    setViewMode('edit')
  }

  const handleViewAsset = (asset: AssetData) => {
    setSelectedAsset(asset)
    setViewMode('details')
  }

  const handleTransferAsset = (asset: AssetData) => {
    // TODO: Implement transfer modal/page
    toast.info('Transfer functionality will be implemented in the next task')
  }

  const handleVerifyAsset = (asset: AssetData) => {
    // TODO: Implement verification modal/page
    toast.info('Verification functionality will be implemented in the next task')
  }

  const handleFormSubmit = async (data: AssetCreateRequest | AssetUpdateRequest) => {
    try {
      setIsLoading(true)
      
      const isEdit = viewMode === 'edit' && selectedAsset
      const url = isEdit ? `/api/assets/${selectedAsset.id}` : '/api/assets'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'create'} asset`)
      }

      if (result.success) {
        toast.success(`Asset ${isEdit ? 'updated' : 'created'} successfully`)
        setViewMode('list')
        setSelectedAsset(null)
      } else {
        throw new Error(result.message || `Failed to ${isEdit ? 'update' : 'create'} asset`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error // Re-throw to let the form handle it
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedAsset(null)
  }

  return (
    <div className="container mx-auto py-6">
      {viewMode === 'list' && (
        <AssetList
          onCreateAsset={handleCreateAsset}
          onEditAsset={handleEditAsset}
          onViewAsset={handleViewAsset}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <AssetForm
          initialData={selectedAsset ? selectedAsset : undefined}
          onSave={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          isEditing={viewMode === 'edit'}
        />
      )}

      {viewMode === 'details' && selectedAsset && (
        <AssetDetails
          assetId={selectedAsset.id}
          onEdit={handleEditAsset}
          onTransfer={handleTransferAsset}
          onVerify={handleVerifyAsset}
          onClose={handleCancel}
        />
      )}
    </div>
  )
}