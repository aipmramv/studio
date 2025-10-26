'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  Database,
  Clock,
  FileText,
  Palette,
  Globe,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ConfigSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  settings: ConfigSetting[]
}

interface ConfigSetting {
  key: string
  label: string
  description: string
  type: 'text' | 'number' | 'boolean' | 'textarea' | 'select' | 'email' | 'url'
  value: any
  options?: { label: string; value: any }[]
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export function SystemConfiguration() {
  const [configSections, setConfigSections] = useState<ConfigSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [originalConfig, setOriginalConfig] = useState<Record<string, any>>({})

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/config/system')
      
      if (!response.ok) {
        throw new Error('Failed to load configuration')
      }

      const data = await response.json()
      
      if (data.success) {
        const config = data.data.config || {}
        setOriginalConfig(config)
        setConfigSections(createConfigSections(config))
      } else {
        throw new Error(data.message || 'Failed to load configuration')
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
      setError(error instanceof Error ? error.message : 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const createConfigSections = (config: Record<string, any>): ConfigSection[] => {
    return [
      {
        id: 'general',
        title: 'General Settings',
        description: 'Basic system configuration and preferences',
        icon: <Settings className="h-4 w-4" />,
        settings: [
          {
            key: 'system.name',
            label: 'System Name',
            description: 'Display name for the application',
            type: 'text',
            value: config['system.name'] || 'KTI Asset Management',
            required: true
          },
          {
            key: 'system.description',
            label: 'System Description',
            description: 'Brief description of the system',
            type: 'textarea',
            value: config['system.description'] || 'Comprehensive asset management system'
          },
          {
            key: 'system.timezone',
            label: 'Default Timezone',
            description: 'System default timezone',
            type: 'select',
            value: config['system.timezone'] || 'Asia/Kolkata',
            options: [
              { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
              { label: 'UTC', value: 'UTC' },
              { label: 'America/New_York (EST)', value: 'America/New_York' },
              { label: 'Europe/London (GMT)', value: 'Europe/London' }
            ]
          },
          {
            key: 'system.language',
            label: 'Default Language',
            description: 'System default language',
            type: 'select',
            value: config['system.language'] || 'en',
            options: [
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' }
            ]
          },
          {
            key: 'system.maintenance_mode',
            label: 'Maintenance Mode',
            description: 'Enable maintenance mode to restrict access',
            type: 'boolean',
            value: config['system.maintenance_mode'] || false
          }
        ]
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Email and notification settings',
        icon: <Bell className="h-4 w-4" />,
        settings: [
          {
            key: 'notifications.email_enabled',
            label: 'Enable Email Notifications',
            description: 'Send email notifications for system events',
            type: 'boolean',
            value: config['notifications.email_enabled'] || true
          },
          {
            key: 'notifications.smtp_host',
            label: 'SMTP Host',
            description: 'SMTP server hostname',
            type: 'text',
            value: config['notifications.smtp_host'] || '',
            required: true
          },
          {
            key: 'notifications.smtp_port',
            label: 'SMTP Port',
            description: 'SMTP server port',
            type: 'number',
            value: config['notifications.smtp_port'] || 587,
            validation: { min: 1, max: 65535 }
          },
          {
            key: 'notifications.smtp_username',
            label: 'SMTP Username',
            description: 'SMTP authentication username',
            type: 'email',
            value: config['notifications.smtp_username'] || ''
          },
          {
            key: 'notifications.from_email',
            label: 'From Email Address',
            description: 'Default sender email address',
            type: 'email',
            value: config['notifications.from_email'] || '',
            required: true
          },
          {
            key: 'notifications.admin_email',
            label: 'Admin Email',
            description: 'Administrator email for system alerts',
            type: 'email',
            value: config['notifications.admin_email'] || '',
            required: true
          }
        ]
      },
      {
        id: 'security',
        title: 'Security',
        description: 'Authentication and security settings',
        icon: <Shield className="h-4 w-4" />,
        settings: [
          {
            key: 'security.session_timeout',
            label: 'Session Timeout (minutes)',
            description: 'User session timeout in minutes',
            type: 'number',
            value: config['security.session_timeout'] || 60,
            validation: { min: 5, max: 1440 }
          },
          {
            key: 'security.password_min_length',
            label: 'Minimum Password Length',
            description: 'Minimum required password length',
            type: 'number',
            value: config['security.password_min_length'] || 8,
            validation: { min: 6, max: 50 }
          },
          {
            key: 'security.require_password_complexity',
            label: 'Require Password Complexity',
            description: 'Enforce complex password requirements',
            type: 'boolean',
            value: config['security.require_password_complexity'] || true
          },
          {
            key: 'security.max_login_attempts',
            label: 'Max Login Attempts',
            description: 'Maximum failed login attempts before lockout',
            type: 'number',
            value: config['security.max_login_attempts'] || 5,
            validation: { min: 3, max: 20 }
          },
          {
            key: 'security.lockout_duration',
            label: 'Lockout Duration (minutes)',
            description: 'Account lockout duration in minutes',
            type: 'number',
            value: config['security.lockout_duration'] || 30,
            validation: { min: 5, max: 1440 }
          },
          {
            key: 'security.enable_2fa',
            label: 'Enable Two-Factor Authentication',
            description: 'Allow users to enable 2FA for their accounts',
            type: 'boolean',
            value: config['security.enable_2fa'] || false
          }
        ]
      },
      {
        id: 'assets',
        title: 'Asset Management',
        description: 'Asset-specific configuration settings',
        icon: <Database className="h-4 w-4" />,
        settings: [
          {
            key: 'assets.auto_generate_numbers',
            label: 'Auto-Generate Asset Numbers',
            description: 'Automatically generate asset numbers for new assets',
            type: 'boolean',
            value: config['assets.auto_generate_numbers'] || true
          },
          {
            key: 'assets.number_prefix',
            label: 'Asset Number Prefix',
            description: 'Prefix for auto-generated asset numbers',
            type: 'text',
            value: config['assets.number_prefix'] || 'AST'
          },
          {
            key: 'assets.verification_reminder_days',
            label: 'Verification Reminder (days)',
            description: 'Days before verification due date to send reminders',
            type: 'number',
            value: config['assets.verification_reminder_days'] || 30,
            validation: { min: 1, max: 365 }
          },
          {
            key: 'assets.default_lifecycle_years',
            label: 'Default Lifecycle (years)',
            description: 'Default asset lifecycle in years',
            type: 'number',
            value: config['assets.default_lifecycle_years'] || 5,
            validation: { min: 1, max: 50 }
          },
          {
            key: 'assets.require_approval_for_transfers',
            label: 'Require Approval for Transfers',
            description: 'All asset transfers require workflow approval',
            type: 'boolean',
            value: config['assets.require_approval_for_transfers'] || true
          },
          {
            key: 'assets.enable_barcode_scanning',
            label: 'Enable Barcode Scanning',
            description: 'Allow barcode scanning for asset identification',
            type: 'boolean',
            value: config['assets.enable_barcode_scanning'] || false
          }
        ]
      },
      {
        id: 'workflows',
        title: 'Workflows',
        description: 'Workflow and approval settings',
        icon: <Clock className="h-4 w-4" />,
        settings: [
          {
            key: 'workflows.default_timeout_hours',
            label: 'Default Step Timeout (hours)',
            description: 'Default timeout for workflow steps in hours',
            type: 'number',
            value: config['workflows.default_timeout_hours'] || 48,
            validation: { min: 1, max: 720 }
          },
          {
            key: 'workflows.enable_escalation',
            label: 'Enable Escalation',
            description: 'Automatically escalate overdue workflow steps',
            type: 'boolean',
            value: config['workflows.enable_escalation'] || true
          },
          {
            key: 'workflows.escalation_hours',
            label: 'Escalation Timeout (hours)',
            description: 'Hours after which to escalate overdue steps',
            type: 'number',
            value: config['workflows.escalation_hours'] || 72,
            validation: { min: 1, max: 720 }
          },
          {
            key: 'workflows.allow_delegation',
            label: 'Allow Delegation',
            description: 'Allow users to delegate workflow tasks',
            type: 'boolean',
            value: config['workflows.allow_delegation'] || true
          },
          {
            key: 'workflows.require_comments',
            label: 'Require Comments',
            description: 'Require comments for all workflow actions',
            type: 'boolean',
            value: config['workflows.require_comments'] || false
          }
        ]
      },
      {
        id: 'reports',
        title: 'Reports',
        description: 'Reporting and analytics settings',
        icon: <FileText className="h-4 w-4" />,
        settings: [
          {
            key: 'reports.retention_days',
            label: 'Report Retention (days)',
            description: 'Number of days to retain generated reports',
            type: 'number',
            value: config['reports.retention_days'] || 30,
            validation: { min: 1, max: 365 }
          },
          {
            key: 'reports.max_export_records',
            label: 'Max Export Records',
            description: 'Maximum number of records in a single export',
            type: 'number',
            value: config['reports.max_export_records'] || 10000,
            validation: { min: 100, max: 100000 }
          },
          {
            key: 'reports.enable_scheduled_reports',
            label: 'Enable Scheduled Reports',
            description: 'Allow users to schedule automatic report generation',
            type: 'boolean',
            value: config['reports.enable_scheduled_reports'] || true
          },
          {
            key: 'reports.default_format',
            label: 'Default Export Format',
            description: 'Default format for report exports',
            type: 'select',
            value: config['reports.default_format'] || 'excel',
            options: [
              { label: 'Excel (.xlsx)', value: 'excel' },
              { label: 'PDF (.pdf)', value: 'pdf' },
              { label: 'CSV (.csv)', value: 'csv' }
            ]
          }
        ]
      }
    ]
  }

  const handleSettingChange = (sectionId: string, settingKey: string, value: any) => {
    setConfigSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting => {
            if (setting.key === settingKey) {
              return { ...setting, value }
            }
            return setting
          })
        }
      }
      return section
    }))
    setHasChanges(true)
  }

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true)
      setError(null)

      // Collect all settings into a flat configuration object
      const config: Record<string, any> = {}
      configSections.forEach(section => {
        section.settings.forEach(setting => {
          config[setting.key] = setting.value
        })
      })

      const response = await fetch('/api/config/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save configuration')
      }

      if (result.success) {
        toast.success('Configuration saved successfully')
        setHasChanges(false)
        setOriginalConfig(config)
      } else {
        throw new Error(result.message || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      setError(error instanceof Error ? error.message : 'Failed to save configuration')
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleResetConfiguration = () => {
    if (!confirm('Are you sure you want to reset all changes? This will discard unsaved modifications.')) {
      return
    }

    setConfigSections(createConfigSections(originalConfig))
    setHasChanges(false)
    toast.info('Configuration reset to last saved state')
  }

  const renderSettingInput = (section: ConfigSection, setting: ConfigSetting) => {
    const handleChange = (value: any) => {
      handleSettingChange(section.id, setting.key, value)
    }

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={setting.value}
              onCheckedChange={handleChange}
            />
            <Label>{setting.value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        )

      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => handleChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <Textarea
            value={setting.value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={setting.description}
            rows={3}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            min={setting.validation?.min}
            max={setting.validation?.max}
          />
        )

      default:
        return (
          <Input
            type={setting.type}
            value={setting.value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={setting.description}
            required={setting.required}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleResetConfiguration}
            disabled={!hasChanges || saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            disabled={!hasChanges || saving}
          >
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {configSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center space-x-2">
              {section.icon}
              <span className="hidden sm:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {configSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {section.icon}
                  <span>{section.title}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.settings.map((setting, index) => (
                  <div key={setting.key}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key} className="text-sm font-medium">
                          {setting.label}
                          {setting.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      </div>
                      {renderSettingInput(section, setting)}
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    {index < section.settings.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}