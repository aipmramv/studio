// import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { MongoDBConnection } from './mongodb-service'
import { ChangeStream, ChangeStreamDocument } from '@/types/server-types'

export class WebSocketService {
  private static instance: WebSocketService
  private io: any | null = null
  private changeStreams: Map<string, ChangeStream> = new Map()

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })

    this.setupEventHandlers()
    this.setupChangeStreams()
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join user to their department room for filtered updates
      socket.on('join-department', (department: string) => {
        socket.join(`department:${department}`)
        console.log(`Socket ${socket.id} joined department: ${department}`)
      })

      // Join user to asset-specific room for detailed updates
      socket.on('join-asset', (assetId: string) => {
        socket.join(`asset:${assetId}`)
        console.log(`Socket ${socket.id} joined asset: ${assetId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private async setupChangeStreams() {
    try {
      const db = await MongoDBConnection.getInstance().connect()

      // Watch assets collection for changes
      const assetChangeStream = db.collection('assets').watch([
        {
          $match: {
            'operationType': { $in: ['insert', 'update', 'delete'] }
          }
        }
      ], { fullDocument: 'updateLookup' })

      assetChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.handleAssetChange(change)
      })

      this.changeStreams.set('assets', assetChangeStream)

      // Watch asset transfers collection
      const transferChangeStream = db.collection('assetTransfers').watch([
        {
          $match: {
            'operationType': { $in: ['insert', 'update'] }
          }
        }
      ], { fullDocument: 'updateLookup' })

      transferChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.handleTransferChange(change)
      })

      this.changeStreams.set('transfers', transferChangeStream)

      // Watch workflow instances for approval updates
      const workflowChangeStream = db.collection('workflowInstances').watch([
        {
          $match: {
            'operationType': { $in: ['insert', 'update'] },
            'fullDocument.category': 'asset_transfer'
          }
        }
      ], { fullDocument: 'updateLookup' })

      workflowChangeStream.on('change', (change: ChangeStreamDocument) => {
        this.handleWorkflowChange(change)
      })

      this.changeStreams.set('workflows', workflowChangeStream)

      console.log('MongoDB change streams initialized')
    } catch (error) {
      console.error('Error setting up change streams:', error)
    }
  }

  private handleAssetChange(change: ChangeStreamDocument) {
    if (!this.io) return

    const { operationType, fullDocument, documentKey } = change

    switch (operationType) {
      case 'insert':
        if (fullDocument) {
          // Notify department room about new asset
          this.io.to(`department:${fullDocument.department}`).emit('asset:created', {
            asset: this.transformAssetDocument(fullDocument),
            timestamp: new Date()
          })
        }
        break

      case 'update':
        if (fullDocument) {
          const transformedAsset = this.transformAssetDocument(fullDocument)
          
          // Notify department room about asset update
          this.io.to(`department:${fullDocument.department}`).emit('asset:updated', {
            asset: transformedAsset,
            timestamp: new Date()
          })

          // Notify asset-specific room for detailed view updates
          this.io.to(`asset:${documentKey._id}`).emit('asset:changed', {
            asset: transformedAsset,
            changeType: 'update',
            timestamp: new Date()
          })
        }
        break

      case 'delete':
        if (documentKey) {
          // Notify all rooms about asset deletion
          this.io.emit('asset:deleted', {
            assetId: documentKey._id.toString(),
            timestamp: new Date()
          })
        }
        break
    }
  }

  private handleTransferChange(change: ChangeStreamDocument) {
    if (!this.io || !change.fullDocument) return

    const transfer = change.fullDocument
    const { operationType } = change

    // Notify relevant departments about transfer updates
    this.io.to(`department:${transfer.fromDepartment}`).emit('transfer:updated', {
      transfer: this.transformTransferDocument(transfer),
      changeType: operationType,
      timestamp: new Date()
    })

    this.io.to(`department:${transfer.toDepartment}`).emit('transfer:updated', {
      transfer: this.transformTransferDocument(transfer),
      changeType: operationType,
      timestamp: new Date()
    })

    // Notify asset-specific room
    if (transfer.assetId) {
      this.io.to(`asset:${transfer.assetId}`).emit('asset:transfer-updated', {
        transfer: this.transformTransferDocument(transfer),
        changeType: operationType,
        timestamp: new Date()
      })
    }
  }

  private handleWorkflowChange(change: ChangeStreamDocument) {
    if (!this.io || !change.fullDocument) return

    const workflow = change.fullDocument
    
    // Notify users about workflow status changes
    if (workflow.assignedTo && Array.isArray(workflow.assignedTo)) {
      workflow.assignedTo.forEach((userId: string) => {
        this.io?.to(`user:${userId}`).emit('workflow:updated', {
          workflow: this.transformWorkflowDocument(workflow),
          timestamp: new Date()
        })
      })
    }

    // Notify about asset-related workflow updates
    if (workflow.contextType === 'asset' && workflow.contextId) {
      this.io.to(`asset:${workflow.contextId}`).emit('asset:workflow-updated', {
        workflow: this.transformWorkflowDocument(workflow),
        timestamp: new Date()
      })
    }
  }

  private transformAssetDocument(doc: any) {
    return {
      id: doc._id.toString(),
      assetNumber: doc.assetNumber,
      assetDescription: doc.assetDescription,
      department: doc.department,
      location: doc.location,
      currentStatus: doc.currentStatus,
      assetClassification: doc.assetClassification,
      assetGrouping: doc.assetGrouping,
      brandName: doc.brandName,
      modelNo: doc.modelNo,
      productSerialNo: doc.productSerialNo,
      purchaseValue: doc.purchaseValue,
      ledgerQty: doc.ledgerQty,
      physicalQty: doc.physicalQty,
      capitalizationDate: doc.capitalizationDate,
      lifecycleYears: doc.lifecycleYears,
      warrantyExpiryDate: doc.warrantyExpiryDate,
      verificationStatus: doc.verificationStatus,
      lastVerificationDate: doc.lastVerificationDate,
      verificationNotes: doc.verificationNotes,
      verifiedBy: doc.verifiedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.createdBy,
      lastModifiedBy: doc.lastModifiedBy
    }
  }

  private transformTransferDocument(doc: any) {
    return {
      id: doc._id.toString(),
      assetId: doc.assetId,
      assetNumber: doc.assetNumber,
      fromDepartment: doc.fromDepartment,
      toDepartment: doc.toDepartment,
      fromLocation: doc.fromLocation,
      toLocation: doc.toLocation,
      status: doc.status,
      requestedBy: doc.requestedBy,
      requestedAt: doc.requestedAt,
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      completedAt: doc.completedAt,
      reason: doc.reason,
      workflowId: doc.workflowId
    }
  }

  private transformWorkflowDocument(doc: any) {
    return {
      id: doc._id.toString(),
      templateId: doc.templateId,
      name: doc.name,
      category: doc.category,
      status: doc.status,
      priority: doc.priority,
      contextType: doc.contextType,
      contextId: doc.contextId,
      contextData: doc.contextData,
      currentStepId: doc.currentStepId,
      currentStepOrder: doc.currentStepOrder,
      assignedTo: doc.assignedTo,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      createdBy: doc.createdBy
    }
  }

  // Public methods for manual notifications
  notifyAssetUpdate(assetId: string, asset: any, department: string) {
    if (!this.io) return

    this.io.to(`department:${department}`).emit('asset:updated', {
      asset,
      timestamp: new Date()
    })

    this.io.to(`asset:${assetId}`).emit('asset:changed', {
      asset,
      changeType: 'update',
      timestamp: new Date()
    })
  }

  notifyTransferStatusChange(transfer: any) {
    if (!this.io) return

    this.io.to(`department:${transfer.fromDepartment}`).emit('transfer:status-changed', {
      transfer,
      timestamp: new Date()
    })

    this.io.to(`department:${transfer.toDepartment}`).emit('transfer:status-changed', {
      transfer,
      timestamp: new Date()
    })
  }

  notifyVerificationUpdate(assetId: string, verification: any, department: string) {
    if (!this.io) return

    this.io.to(`department:${department}`).emit('verification:updated', {
      assetId,
      verification,
      timestamp: new Date()
    })

    this.io.to(`asset:${assetId}`).emit('asset:verification-updated', {
      verification,
      timestamp: new Date()
    })
  }

  // Cleanup method
  async cleanup() {
    // Close all change streams
    for (const [name, stream] of this.changeStreams) {
      try {
        await stream.close()
        console.log(`Closed change stream: ${name}`)
      } catch (error) {
        console.error(`Error closing change stream ${name}:`, error)
      }
    }
    this.changeStreams.clear()

    // Close socket.io server
    if (this.io) {
      this.io.close()
      this.io = null
    }
  }
}

export const webSocketService = WebSocketService.getInstance()