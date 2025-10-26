'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { AssetData, AssetTransfer } from '@/types/asset'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface AssetUpdateEvent {
  asset: AssetData
  timestamp: Date
}

interface TransferUpdateEvent {
  transfer: AssetTransfer
  changeType: 'insert' | 'update'
  timestamp: Date
}

interface VerificationUpdateEvent {
  assetId: string
  verification: any
  timestamp: Date
}

interface UseAssetUpdatesOptions {
  onAssetCreated?: (event: AssetUpdateEvent) => void
  onAssetUpdated?: (event: AssetUpdateEvent) => void
  onAssetDeleted?: (event: { assetId: string; timestamp: Date }) => void
  onTransferUpdated?: (event: TransferUpdateEvent) => void
  onVerificationUpdated?: (event: VerificationUpdateEvent) => void
  enableNotifications?: boolean
  watchAssetId?: string
}

export function useAssetUpdates(options: UseAssetUpdatesOptions = {}) {
  const {
    onAssetCreated,
    onAssetUpdated,
    onAssetDeleted,
    onTransferUpdated,
    onVerificationUpdated,
    enableNotifications = true,
    watchAssetId
  } = options

  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000', {
      auth: {
        userId: user.id,
        department: user.department,
        role: user.role
      },
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
      setConnectionError(null)

      // Join department room for filtered updates
      socket.emit('join-department', user.department)

      // Join asset-specific room if watching a specific asset
      if (watchAssetId) {
        socket.emit('join-asset', watchAssetId)
      }
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    // Asset event handlers
    socket.on('asset:created', (event: AssetUpdateEvent) => {
      console.log('Asset created:', event)
      
      if (enableNotifications) {
        toast.success(`New asset created: ${event.asset.assetNumber}`)
      }
      
      onAssetCreated?.(event)
    })

    socket.on('asset:updated', (event: AssetUpdateEvent) => {
      console.log('Asset updated:', event)
      
      if (enableNotifications) {
        toast.info(`Asset updated: ${event.asset.assetNumber}`)
      }
      
      onAssetUpdated?.(event)
    })

    socket.on('asset:deleted', (event: { assetId: string; timestamp: Date }) => {
      console.log('Asset deleted:', event)
      
      if (enableNotifications) {
        toast.error('An asset has been deleted')
      }
      
      onAssetDeleted?.(event)
    })

    socket.on('asset:changed', (event: AssetUpdateEvent & { changeType: string }) => {
      console.log('Asset changed (detailed):', event)
      
      // This is for asset-specific updates when viewing asset details
      onAssetUpdated?.(event)
    })

    // Transfer event handlers
    socket.on('transfer:updated', (event: TransferUpdateEvent) => {
      console.log('Transfer updated:', event)
      
      if (enableNotifications) {
        const statusMessage = event.transfer.status === 'Completed' 
          ? 'Transfer completed' 
          : `Transfer ${event.transfer.status.toLowerCase()}`
        toast.info(`${statusMessage}: ${event.transfer.assetNumber}`)
      }
      
      onTransferUpdated?.(event)
    })

    socket.on('asset:transfer-updated', (event: TransferUpdateEvent) => {
      console.log('Asset transfer updated:', event)
      onTransferUpdated?.(event)
    })

    // Verification event handlers
    socket.on('verification:updated', (event: VerificationUpdateEvent) => {
      console.log('Verification updated:', event)
      
      if (enableNotifications) {
        toast.success('Asset verification updated')
      }
      
      onVerificationUpdated?.(event)
    })

    socket.on('asset:verification-updated', (event: VerificationUpdateEvent) => {
      console.log('Asset verification updated (detailed):', event)
      onVerificationUpdated?.(event)
    })

    // Workflow event handlers
    socket.on('workflow:updated', (event: any) => {
      console.log('Workflow updated:', event)
      
      if (enableNotifications) {
        toast.info(`Workflow updated: ${event.workflow.name}`)
      }
    })

    socket.on('asset:workflow-updated', (event: any) => {
      console.log('Asset workflow updated:', event)
      
      if (enableNotifications) {
        toast.info('Asset workflow status updated')
      }
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [user, watchAssetId, enableNotifications])

  // Update asset room subscription when watchAssetId changes
  useEffect(() => {
    if (!socketRef.current || !isConnected) return

    if (watchAssetId) {
      socketRef.current.emit('join-asset', watchAssetId)
    }
  }, [watchAssetId, isConnected])

  // Manual methods for triggering updates
  const refreshAssetList = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('refresh-asset-list')
    }
  }

  const subscribeToAsset = (assetId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-asset', assetId)
    }
  }

  const unsubscribeFromAsset = (assetId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-asset', assetId)
    }
  }

  return {
    isConnected,
    connectionError,
    refreshAssetList,
    subscribeToAsset,
    unsubscribeFromAsset
  }
}

// Specialized hook for asset list updates
export function useAssetListUpdates(onUpdate?: () => void) {
  const [assets, setAssets] = useState<AssetData[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const { isConnected } = useAssetUpdates({
    onAssetCreated: (event) => {
      setAssets(prev => [event.asset, ...prev])
      setLastUpdate(new Date(event.timestamp))
      onUpdate?.()
    },
    onAssetUpdated: (event) => {
      setAssets(prev => prev.map(asset => 
        asset.id === event.asset.id ? event.asset : asset
      ))
      setLastUpdate(new Date(event.timestamp))
      onUpdate?.()
    },
    onAssetDeleted: (event) => {
      setAssets(prev => prev.filter(asset => asset.id !== event.assetId))
      setLastUpdate(new Date(event.timestamp))
      onUpdate?.()
    },
    enableNotifications: true
  })

  return {
    assets,
    setAssets,
    lastUpdate,
    isConnected
  }
}

// Specialized hook for asset details updates
export function useAssetDetailsUpdates(assetId: string, onUpdate?: (asset: AssetData) => void) {
  const [asset, setAsset] = useState<AssetData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const { isConnected } = useAssetUpdates({
    watchAssetId: assetId,
    onAssetUpdated: (event) => {
      if (event.asset.id === assetId) {
        setAsset(event.asset)
        setLastUpdate(new Date(event.timestamp))
        onUpdate?.(event.asset)
      }
    },
    onVerificationUpdated: (event) => {
      if (event.assetId === assetId) {
        setLastUpdate(new Date(event.timestamp))
        // Trigger a refresh of asset data
        onUpdate?.(asset!)
      }
    },
    enableNotifications: false // Disable notifications for details view
  })

  return {
    asset,
    setAsset,
    lastUpdate,
    isConnected
  }
}