'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react'

interface DatabaseStatusData {
  connected: boolean
  details: any
  collections: Array<{ name: string; type: string }>
  timestamp: string
}

interface DatabaseStatusResponse {
  status: 'success' | 'error'
  data?: DatabaseStatusData
  error?: {
    message: string
    details: string
    timestamp: string
  }
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/database/status')
      const data: DatabaseStatusResponse = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        status: 'error',
        error: {
          message: 'Failed to fetch database status',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const isConnected = status?.status === 'success' && status.data?.connected

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <CardTitle>Database Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkDatabaseStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          MongoDB connection and database health status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Connection Status</span>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Database Details */}
        {status?.status === 'success' && status.data && (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">Database Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Database:</span>
                  <div className="font-mono">{status.data.details?.database || 'kti_assets'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Collections:</span>
                  <div className="font-mono">{status.data.collections?.length || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Response Time:</span>
                  <div className="font-mono">{status.data.details?.responseTime || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Check:</span>
                  <div className="font-mono text-xs">
                    {new Date(status.data.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Collections List */}
            {status.data.collections && status.data.collections.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Collections</h4>
                <div className="grid grid-cols-2 gap-2">
                  {status.data.collections.map((collection) => (
                    <Badge key={collection.name} variant="secondary" className="justify-start">
                      {collection.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {status?.status === 'error' && (
          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Error Details</h4>
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm font-medium">{status.error?.message}</p>
              {status.error?.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {status.error.details}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Checking database status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}