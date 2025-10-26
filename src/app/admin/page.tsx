'use client'

import React, { useState } from 'react'
import { UserManagement } from '@/components/admin/UserManagement'
import { MasterDataManagement } from '@/components/admin/MasterDataManagement'
import { SystemConfiguration } from '@/components/admin/SystemConfiguration'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Database, 
  Settings, 
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingApprovals: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastBackup: Date
  storageUsed: number
  storageTotal: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [adminStats] = useState<AdminStats>({
    totalUsers: 45,
    activeUsers: 42,
    pendingApprovals: 8,
    systemHealth: 'healthy',
    lastBackup: new Date(),
    storageUsed: 2.4,
    storageTotal: 10
  })

  const { user, hasPermission } = usePermissions()
  
  const isAdmin = user.role === 'admin'
  const canManageUsers = hasPermission('users', 'create') || hasPermission('users', 'update')
  const canManageSystem = hasPermission('masters', 'create') || hasPermission('masters', 'update')

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You do not have permission to access the administration panel.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'outline'
      case 'critical':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Manage users, system configuration, and master data
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center space-x-2"
              disabled={!canManageUsers}
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="master-data" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Master Data</span>
            </TabsTrigger>
            <TabsTrigger 
              value="configuration" 
              className="flex items-center space-x-2"
              disabled={!canManageSystem}
            >
              <Settings className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{adminStats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{adminStats.activeUsers}</p>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{adminStats.pendingApprovals}</p>
                      <p className="text-xs text-muted-foreground">Pending Approvals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    {getHealthIcon(adminStats.systemHealth)}
                    <div>
                      <Badge variant={getHealthBadgeVariant(adminStats.systemHealth)}>
                        {adminStats.systemHealth.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground">System Health</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Backup</span>
                    <span className="text-sm font-medium">
                      {formatDate(adminStats.lastBackup)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">
                      {adminStats.storageUsed} GB / {adminStats.storageTotal} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${(adminStats.storageUsed / adminStats.storageTotal) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">System Version</span>
                    <span className="text-sm font-medium">v1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Database Status</span>
                    <Badge variant="default">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {canManageUsers && (
                      <button
                        onClick={() => setActiveTab('users')}
                        className="flex items-center space-x-2 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">Manage Users</p>
                          <p className="text-sm text-muted-foreground">
                            Add, edit, or deactivate user accounts
                          </p>
                        </div>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setActiveTab('master-data')}
                      className="flex items-center space-x-2 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Database className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Master Data</p>
                        <p className="text-sm text-muted-foreground">
                          Manage departments, locations, and classifications
                        </p>
                      </div>
                    </button>

                    {canManageSystem && (
                      <button
                        onClick={() => setActiveTab('configuration')}
                        className="flex items-center space-x-2 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="font-medium">System Configuration</p>
                          <p className="text-sm text-muted-foreground">
                            Configure system settings and preferences
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Administrative Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-muted-foreground">2 hours ago</span>
                    <span>New user account created for John Doe</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-muted-foreground">4 hours ago</span>
                    <span>System configuration updated - Email notifications enabled</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-muted-foreground">1 day ago</span>
                    <span>Master data imported - 15 new departments added</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-muted-foreground">2 days ago</span>
                    <span>User role updated for Jane Smith - promoted to SPOC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {canManageUsers ? (
              <UserManagement />
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You do not have permission to manage users.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="master-data" className="mt-6">
            <MasterDataManagement />
          </TabsContent>

          <TabsContent value="configuration" className="mt-6">
            {canManageSystem ? (
              <SystemConfiguration />
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  You do not have permission to manage system configuration.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}