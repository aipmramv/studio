import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { configurationManagementService } from '@/lib/configuration-management'
import { createSuccessResponse } from '@/lib/api-utils'
import { JWTPayload } from '@/types/auth'

// GET /api/config/alerts - Get alert rules
async function getAlertRules(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category') || undefined
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined

    const rules = await configurationManagementService.getAlertRules(category, isActive)

    return createSuccessResponse({
      rules,
      total: rules.length,
      filters: { category, isActive }
    })
  } catch (error) {
    console.error('Get alert rules error:', error)
    return NextResponse.json(
      { error: 'Failed to get alert rules' },
      { status: 500 }
    )
  }
}

// POST /api/config/alerts - Create alert rule
async function createAlertRule(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category,
      metric,
      condition,
      severity,
      actions,
      isActive,
      suppressionRules
    } = body

    // Validate required fields
    if (!name || !category || !metric || !condition || !severity || !actions) {
      return NextResponse.json(
        { error: 'Name, category, metric, condition, severity, and actions are required' },
        { status: 400 }
      )
    }

    // Check permissions (admin only)
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create alert rules' },
        { status: 403 }
      )
    }

    // Validate condition
    if (!condition.operator || condition.threshold === undefined) {
      return NextResponse.json(
        { error: 'Condition must have operator and threshold' },
        { status: 400 }
      )
    }

    // Validate severity
    if (!['info', 'warning', 'error', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Severity must be info, warning, error, or critical' },
        { status: 400 }
      )
    }

    const rule = await configurationManagementService.createAlertRule(
      {
        name,
        description: description || '',
        category,
        metric,
        condition,
        severity,
        actions,
        isActive: isActive !== false,
        suppressionRules: suppressionRules || []
      },
      user.id
    )

    return createSuccessResponse({
      rule,
      message: 'Alert rule created successfully'
    })
  } catch (error) {
    console.error('Create alert rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    )
  }
}

export const GET = withApiMiddleware(getAlertRules)
export const POST = withApiMiddleware(createAlertRule)