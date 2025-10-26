'use client'

import React from 'react'
import { SimpleIntegrationTest } from '@/components/integration/SimpleIntegrationTest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

export default function IntegrationTestPage() {
  return (
    <div className="container mx-auto py-6">
      <SimpleIntegrationTest />
    </div>
  )
}