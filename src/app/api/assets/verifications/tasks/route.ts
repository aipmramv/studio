import { NextRequest } from 'next/server'
import { createSuccessResponse, parsePaginationParams, parseFilterParams } from '@/lib/api-utils'
import { withApiMiddleware } from '@/lib/auth-middleware'
import { MongoDBConnection } from '@/lib/mongodb-service'
import { ObjectId, isValidObjectId } from '@/types/server-types'

// GET /api/assets/verifications/tasks - Get verification follow-up tasks
async function getVerificationTasksHandler(request: NextRequest, user: any) {
  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(searchParams)
  const filters = parseFilterParams(searchParams)

  const db = MongoDBConnection.getInstance().getDb()
  const tasksCollection = db.collection('verificationTasks')

  // Build query
  const query: any = {}

  // Role-based filtering
  if (user.role !== 'admin') {
    query.assignedTo = user.department
  } else if (filters.department) {
    query.assignedTo = filters.department
  }

  // Apply filters
  if (filters.status) query.status = filters.status
  if (filters.assetNumber) query.assetNumber = { $regex: filters.assetNumber, $options: 'i' }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.createdAt = {}
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate)
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate)
  }

  // Get total count
  const total = await tasksCollection.countDocuments(query)

  // Get tasks with pagination
  const tasks = await tasksCollection
    .find(query)
    .sort({ dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  // Add overdue flag to tasks
  const tasksWithStatus = tasks.map(task => ({
    ...task,
    isOverdue: task.dueDate && new Date() > task.dueDate && task.status === 'Pending',
    daysUntilDue: task.dueDate ? Math.ceil((task.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
  }))

  return createSuccessResponse({
    tasks: tasksWithStatus,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

// PUT /api/assets/verifications/tasks/[id] - Update task status
async function updateTaskHandler(request: NextRequest, user: any) {
  const { taskId, status, completedBy, completedAt, notes } = await request.json()

  if (!taskId) {
    throw new Error('Task ID is required')
  }

  const db = MongoDBConnection.getInstance().getDb()
  const tasksCollection = db.collection('verificationTasks')

  // Get existing task
  const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) })
  if (!task) {
    throw new Error('Task not found')
  }

  // Check permissions
  if (user.role !== 'admin' && task.assignedTo !== user.department) {
    throw new Error('You can only update tasks assigned to your department')
  }

  // Update task
  const updateData: any = {
    status,
    updatedAt: new Date(),
  }

  if (status === 'Completed') {
    updateData.completedBy = completedBy || user.id
    updateData.completedByName = user.name
    updateData.completedAt = completedAt ? new Date(completedAt) : new Date()
  }

  if (notes) {
    updateData.notes = notes
  }

  const result = await tasksCollection.updateOne(
    { _id: new ObjectId(taskId) },
    { $set: updateData }
  )

  if (result.modifiedCount === 0) {
    throw new Error('Failed to update task')
  }

  // Get updated task
  const updatedTask = await tasksCollection.findOne({ _id: new ObjectId(taskId) })

  return createSuccessResponse(updatedTask, 'Task updated successfully')
}

export const GET = withApiMiddleware(getVerificationTasksHandler)
export const PUT = withApiMiddleware(updateTaskHandler)