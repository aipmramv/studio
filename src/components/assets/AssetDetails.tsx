'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Edit,
    ArrowLeftRight,
    CheckCircle,
    History,
    FileText,
    Calendar,
    MapPin,
    DollarSign,
    Package,
    Settings,
    Loader2
} from 'lucide-react'
import { AssetData } from '@/types/asset'
import { usePermissions } from '@/hooks/usePermissions'
import { useAssetDetailsUpdates } from '@/hooks/useAssetUpdates'

interface AssetDetailsProps {
    assetId: string
    onEdit: (asset: AssetData) => void
    onTransfer: (asset: AssetData) => void
    onVerify: (asset: AssetData) => void
    onClose: () => void
}

interface AssetHistory {
    id: string
    action: string
    description: string
    performedBy: string
    performedAt: Date
    details?: Record<string, any>
}

interface AssetTransfer {
    id: string
    fromDepartment: string
    toDepartment: string
    fromLocation: string
    toLocation: string
    status: string
    requestedBy: string
    requestedAt: Date
    approvedBy?: string
    approvedAt?: Date
    reason: string
}

export function AssetDetails({
    assetId,
    onEdit,
    onTransfer,
    onVerify,
    onClose
}: AssetDetailsProps) {
    const [asset, setAsset] = useState<AssetData | null>(null)
    const [history, setHistory] = useState<AssetHistory[]>([])
    const [transfers, setTransfers] = useState<AssetTransfer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('details')

    const { canEdit, canTransfer, canVerify } = usePermissions()

    useEffect(() => {
        loadAssetDetails()
    }, [assetId])

    // Set up real-time updates for this specific asset
    useAssetDetailsUpdates(assetId, (updatedAsset) => {
        setAsset(updatedAsset)
    })

    const loadAssetDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            // Load asset details
            const [assetRes, historyRes, transfersRes] = await Promise.all([
                fetch(`/api/assets/${assetId}`),
                fetch(`/api/assets/${assetId}/history`),
                fetch(`/api/assets/transfers?assetId=${assetId}`)
            ])

            if (!assetRes.ok) {
                throw new Error('Failed to load asset details')
            }

            const assetData = await assetRes.json()
            if (assetData.success) {
                setAsset(assetData.data.asset)
            } else {
                throw new Error(assetData.message || 'Failed to load asset')
            }

            // Load history if available
            if (historyRes.ok) {
                const historyData = await historyRes.json()
                if (historyData.success) {
                    setHistory(historyData.data.history || [])
                }
            }

            // Load transfers if available
            if (transfersRes.ok) {
                const transfersData = await transfersRes.json()
                if (transfersData.success) {
                    setTransfers(transfersData.data.transfers || [])
                }
            }
        } catch (error) {
            console.error('Error loading asset details:', error)
            setError(error instanceof Error ? error.message : 'Failed to load asset details')
        } finally {
            setLoading(false)
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

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-'
        return `₹${amount.toLocaleString('en-IN')}`
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading asset details...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button onClick={onClose} variant="outline">
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!asset) {
        return (
            <Card>
                <CardContent className="p-6">
                    <Alert>
                        <AlertDescription>Asset not found</AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button onClick={onClose} variant="outline">
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">{asset.assetNumber}</h1>
                    <p className="text-lg text-muted-foreground">{asset.assetDescription}</p>
                    <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={getStatusBadgeVariant(asset.currentStatus)}>
                            {asset.currentStatus}
                        </Badge>
                        <Badge variant={getVerificationBadgeVariant(asset.verificationStatus)}>
                            {asset.verificationStatus}
                        </Badge>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={onClose}>
                        Back
                    </Button>
                    {canVerify('assets') && (
                        <Button variant="outline" onClick={() => onVerify(asset)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify
                        </Button>
                    )}
                    {canTransfer('assets') && (
                        <Button variant="outline" onClick={() => onTransfer(asset)}>
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Transfer
                        </Button>
                    )}
                    {canEdit('assets') && (
                        <Button onClick={() => onEdit(asset)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="details">
                        <FileText className="mr-2 h-4 w-4" />
                        Details
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="mr-2 h-4 w-4" />
                        History
                    </TabsTrigger>
                    <TabsTrigger value="transfers">
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Transfers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Package className="mr-2 h-4 w-4" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Asset Number</label>
                                        <p className="font-medium">{asset.assetNumber}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Classification</label>
                                        <p>{asset.assetClassification}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Grouping</label>
                                        <p>{asset.assetGrouping || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <Badge variant={getStatusBadgeVariant(asset.currentStatus)}>
                                            {asset.currentStatus}
                                        </Badge>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p>{asset.assetDescription}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Location Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                                        <p className="font-medium">{asset.department}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                                        <p>{asset.location}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Ledger Qty</label>
                                            <p>{asset.ledgerQty}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Physical Qty</label>
                                            <p>{asset.physicalQty || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Technical Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Brand</label>
                                        <p>{asset.brandName || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Model</label>
                                        <p>{asset.modelNo || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                                        <p>{asset.productSerialNo || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Financial Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Purchase Value</label>
                                        <p className="font-medium">{formatCurrency(asset.purchaseValue)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Lifecycle Years</label>
                                        <p>{asset.lifecycleYears || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Important Dates */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Important Dates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Capitalization Date</label>
                                        <p>{formatDate(asset.capitalizationDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Warranty Expiry</label>
                                        <p>{formatDate(asset.warrantyExpiryDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Last Verification</label>
                                        <p>{formatDate(asset.lastVerificationDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                                        <p>{formatDate(asset.createdAt)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification Status */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Verification Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Current Status</p>
                                        <Badge variant={getVerificationBadgeVariant(asset.verificationStatus)}>
                                            {asset.verificationStatus}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Last Verified</p>
                                        <p className="font-medium">{formatDate(asset.lastVerificationDate)}</p>
                                        {asset.verifiedBy && (
                                            <p className="text-sm text-muted-foreground">by {asset.verifiedBy}</p>
                                        )}
                                    </div>
                                </div>
                                {asset.verificationNotes && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                        <p className="text-sm">{asset.verificationNotes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Asset History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No history available</p>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((entry) => (
                                        <div key={entry.id} className="border-l-2 border-muted pl-4 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{entry.action}</p>
                                                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                                                </div>
                                                <div className="text-right text-sm text-muted-foreground">
                                                    <p>{formatDate(entry.performedAt)}</p>
                                                    <p>by {entry.performedBy}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transfers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transfers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No transfers found</p>
                            ) : (
                                <div className="space-y-4">
                                    {transfers.map((transfer) => (
                                        <div key={transfer.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">
                                                        {transfer.fromDepartment} → {transfer.toDepartment}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {transfer.fromLocation} → {transfer.toLocation}
                                                    </p>
                                                </div>
                                                <Badge variant={transfer.status === 'Completed' ? 'default' : 'outline'}>
                                                    {transfer.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm mb-2">{transfer.reason}</p>
                                            <div className="text-xs text-muted-foreground">
                                                <p>Requested by {transfer.requestedBy} on {formatDate(transfer.requestedAt)}</p>
                                                {transfer.approvedBy && (
                                                    <p>Approved by {transfer.approvedBy} on {formatDate(transfer.approvedAt)}</p>
                                                )}
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