import 'server-only'

import { MongoDBConnection } from './mongodb-service'
import { ChangeStream, ChangeStreamDocument } from 'mongodb'
import { EventEmitter } from 'events'

// Change stream event types
export interface ChangeStreamEvent {
  operationType: 'insert' | 'update' | 'delete' | 'replace'
  collection: string
  documentId: string
  fullDocument?: any
  updateDescription?: {
    updatedFields: any
    removedFields: string[]
  }
  timestamp: Date
}

// Change stream service for real-time updates
export class ChangeStreamsService extends EventEmitter {
  private static instance: ChangeStreamsService
  private changeStreams: Map<string, ChangeStream> = new Map()
  private isInitialized: boolean = false

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many listeners
  }

  public static getInstance(): ChangeStreamsService {
    if (!ChangeStreamsService.instance) {
      ChangeStreamsService.instance = new ChangeStreamsService()
    }
    return ChangeStreamsService.instance
  }

  /**
   * Initialize change streams for all collections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const connection = MongoDBConnection.getInstance()
      const db = await connection.connect()

      // Collections to monitor
      const collections = ['assets', 'users', 'workflows', 'assetMovements']

      for (const collectionName of collections) {
        await this.setupChangeStream(collectionName)
      }

      this.isInitialized = true
      console.log('Change streams initialized successfully')
    } catch (error) {
      console.error('Failed to initialize change streams:', error)
      throw error
    }
  }

  /**
   * Setup change stream for a specific collection
   */
  private async setupChangeStream(collectionName: string): Promise<void> {
    try {
      const connection = MongoDBConnection.getInstance()
      const db = connection.getDb()
      const collection = db.collection(collectionName)

      // Create change stream with options
      const changeStream = collection.watch([], {
        fullDocument: 'updateLookup', // Include full document for updates
        fullDocumentBeforeChange: 'whenAvailable' // Include document before change
      })

      // Handle change events
      changeStream.on('change', (change: ChangeStreamDocument) => {
        this.handleChangeEvent(collectionName, change)
      })

      // Handle errors
      changeStream.on('error', (error) => {
        console.error(`Change stream error for ${collectionName}:`, error)
        this.emit('error', { collection: collectionName, error })
        
        // Attempt to restart the change stream
        setTimeout(() => {
          this.restartChangeStream(collectionName)
        }, 5000)
      })

      // Handle close
      changeStream.on('close', () => {
        console.warn(`Change stream closed for ${collectionName}`)
        this.changeStreams.delete(collectionName)
      })

      this.changeStreams.set(collectionName, changeStream)
      console.log(`Change stream setup for collection: ${collectionName}`)
    } catch (error) {
      console.error(`Failed to setup change stream for ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Handle individual change events
   */
  private handleChangeEvent(collectionName: string, change: ChangeStreamDocument): void {
    try {
      const event: ChangeStreamEvent = {
        operationType: change.operationType as any,
        collection: collectionName,
        documentId: change.documentKey?._id?.toString() || '',
        fullDocument: change.fullDocument,
        updateDescription: change.updateDescription,
        timestamp: new Date()
      }

      // Emit specific events
      this.emit(`${collectionName}:${change.operationType}`, event)
      this.emit('change', event)

      // Emit collection-specific events
      this.emit(collectionName, event)

      // Log significant changes
      if (change.operationType === 'insert') {
        console.log(`New ${collectionName} created:`, change.documentKey?._id)
      } else if (change.operationType === 'delete') {
        console.log(`${collectionName} deleted:`, change.documentKey?._id)
      }
    } catch (error) {
      console.error('Error handling change event:', error)
    }
  }

  /**
   * Restart a change stream
   */
  private async restartChangeStream(collectionName: string): Promise<void> {
    try {
      // Close existing stream if it exists
      const existingStream = this.changeStreams.get(collectionName)
      if (existingStream) {
        await existingStream.close()
        this.changeStreams.delete(collectionName)
      }

      // Setup new stream
      await this.setupChangeStream(collectionName)
      console.log(`Change stream restarted for ${collectionName}`)
    } catch (error) {
      console.error(`Failed to restart change stream for ${collectionName}:`, error)
    }
  }

  /**
   * Subscribe to changes for a specific collection
   */
  subscribeToCollection(
    collectionName: string, 
    callback: (event: ChangeStreamEvent) => void
  ): () => void {
    this.on(collectionName, callback)
    
    // Return unsubscribe function
    return () => {
      this.off(collectionName, callback)
    }
  }

  /**
   * Subscribe to specific operation types
   */
  subscribeToOperation(
    collectionName: string,
    operationType: 'insert' | 'update' | 'delete',
    callback: (event: ChangeStreamEvent) => void
  ): () => void {
    const eventName = `${collectionName}:${operationType}`
    this.on(eventName, callback)
    
    return () => {
      this.off(eventName, callback)
    }
  }

  /**
   * Subscribe to all changes
   */
  subscribeToAllChanges(callback: (event: ChangeStreamEvent) => void): () => void {
    this.on('change', callback)
    
    return () => {
      this.off('change', callback)
    }
  }

  /**
   * Get active change streams
   */
  getActiveStreams(): string[] {
    return Array.from(this.changeStreams.keys())
  }

  /**
   * Close all change streams
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.changeStreams.values()).map(stream => 
      stream.close().catch(error => {
        console.error('Error closing change stream:', error)
      })
    )

    await Promise.all(closePromises)
    this.changeStreams.clear()
    this.isInitialized = false
    console.log('All change streams closed')
  }

  /**
   * Health check for change streams
   */
  getHealthStatus(): {
    isInitialized: boolean
    activeStreams: number
    streamNames: string[]
  } {
    return {
      isInitialized: this.isInitialized,
      activeStreams: this.changeStreams.size,
      streamNames: this.getActiveStreams()
    }
  }
}

// Real-time analytics aggregator
export class RealTimeAnalyticsAggregator {
  private changeStreamsService: ChangeStreamsService
  private analyticsCache: Map<string, any> = new Map()
  private updateTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.changeStreamsService = ChangeStreamsService.getInstance()
    this.setupEventListeners()
  }

  /**
   * Setup event listeners for real-time analytics
   */
  private setupEventListeners(): void {
    // Listen to asset changes
    this.changeStreamsService.subscribeToCollection('assets', (event) => {
      this.handleAssetChange(event)
    })

    // Listen to movement changes
    this.changeStreamsService.subscribeToCollection('assetMovements', (event) => {
      this.handleMovementChange(event)
    })

    // Listen to workflow changes
    this.changeStreamsService.subscribeToCollection('workflows', (event) => {
      this.handleWorkflowChange(event)
    })
  }

  /**
   * Handle asset changes for real-time analytics
   */
  private handleAssetChange(event: ChangeStreamEvent): void {
    // Debounce analytics updates
    this.debounceAnalyticsUpdate('assets', () => {
      this.updateAssetAnalytics(event)
    })
  }

  /**
   * Handle movement changes
   */
  private handleMovementChange(event: ChangeStreamEvent): void {
    this.debounceAnalyticsUpdate('movements', () => {
      this.updateMovementAnalytics(event)
    })
  }

  /**
   * Handle workflow changes
   */
  private handleWorkflowChange(event: ChangeStreamEvent): void {
    this.debounceAnalyticsUpdate('workflows', () => {
      this.updateWorkflowAnalytics(event)
    })
  }

  /**
   * Debounce analytics updates to avoid excessive recalculation
   */
  private debounceAnalyticsUpdate(key: string, updateFunction: () => void): void {
    // Clear existing timer
    const existingTimer = this.updateTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      updateFunction()
      this.updateTimers.delete(key)
    }, 1000) // 1 second debounce

    this.updateTimers.set(key, timer)
  }

  /**
   * Update asset analytics cache
   */
  private async updateAssetAnalytics(event: ChangeStreamEvent): Promise<void> {
    try {
      // This would trigger a recalculation of asset analytics
      // and emit events to connected clients
      console.log('Updating asset analytics due to change:', event.operationType)
      
      // Emit event for real-time dashboard updates
      this.changeStreamsService.emit('analytics:assets:updated', {
        timestamp: new Date(),
        trigger: event
      })
    } catch (error) {
      console.error('Error updating asset analytics:', error)
    }
  }

  /**
   * Update movement analytics cache
   */
  private async updateMovementAnalytics(event: ChangeStreamEvent): Promise<void> {
    try {
      console.log('Updating movement analytics due to change:', event.operationType)
      
      this.changeStreamsService.emit('analytics:movements:updated', {
        timestamp: new Date(),
        trigger: event
      })
    } catch (error) {
      console.error('Error updating movement analytics:', error)
    }
  }

  /**
   * Update workflow analytics cache
   */
  private async updateWorkflowAnalytics(event: ChangeStreamEvent): Promise<void> {
    try {
      console.log('Updating workflow analytics due to change:', event.operationType)
      
      this.changeStreamsService.emit('analytics:workflows:updated', {
        timestamp: new Date(),
        trigger: event
      })
    } catch (error) {
      console.error('Error updating workflow analytics:', error)
    }
  }

  /**
   * Get cached analytics
   */
  getCachedAnalytics(type: string): any {
    return this.analyticsCache.get(type)
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.analyticsCache.clear()
    
    // Clear all timers
    this.updateTimers.forEach(timer => clearTimeout(timer))
    this.updateTimers.clear()
  }
}

// Export services
export const changeStreamsService = ChangeStreamsService.getInstance()
export const realTimeAnalyticsAggregator = new RealTimeAnalyticsAggregator()