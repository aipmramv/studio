#!/usr/bin/env ts-node

/**
 * Database initialization script
 * Run this script to set up the MongoDB database with proper indexes and initial data
 */

import { databaseInitializer } from '../src/lib/database-initializer'
import { MongoDBConnection } from '../src/lib/mongodb-service'

// Configuration for initialization
const DEFAULT_CONFIG = {
  createAdminUser: true,
  createSampleUsers: process.env.NODE_ENV === 'development',
  createMasterData: true,
  createSampleAssets: process.env.NODE_ENV === 'development',
  runMigrations: true
}

async function main() {
  try {
    console.log('Starting database initialization...')
    console.log('Environment:', process.env.NODE_ENV || 'development')
    
    // Parse command line arguments
    const args = process.argv.slice(2)
    const config = { ...DEFAULT_CONFIG }
    
    // Parse arguments
    args.forEach(arg => {
      if (arg === '--no-samples') {
        config.createSampleUsers = false
        config.createSampleAssets = false
      } else if (arg === '--samples') {
        config.createSampleUsers = true
        config.createSampleAssets = true
      } else if (arg === '--reset') {
        // Reset database before initialization
        console.log('Resetting database...')
        return resetAndInitialize(config)
      }
    })
    
    // Initialize database
    const result = await databaseInitializer.initialize(config)
    
    if (result.success) {
      console.log('\n✅ Database initialization completed successfully!')
      console.log(`Total duration: ${result.totalDuration}ms`)
      
      // Show step results
      console.log('\nStep Results:')
      result.steps.forEach(step => {
        const status = step.success ? '✅' : '❌'
        console.log(`${status} ${step.step}: ${step.message}`)
      })
      
      // Show any errors
      if (result.errors.length > 0) {
        console.log('\nErrors encountered:')
        result.errors.forEach(error => {
          console.log(`❌ ${error}`)
        })
      }
    } else {
      console.error('\n❌ Database initialization failed!')
      console.error('Errors:', result.errors)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  } finally {
    // Close database connection
    await MongoDBConnection.getInstance().disconnect()
    process.exit(0)
  }
}

async function resetAndInitialize(config: any) {
  try {
    console.log('⚠️  WARNING: This will delete all existing data!')
    
    // In a real scenario, you might want to add a confirmation prompt
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Database reset is not allowed in production!')
      process.exit(1)
    }
    
    await databaseInitializer.resetDatabase()
    console.log('✅ Database reset completed')
    
    // Now initialize
    const result = await databaseInitializer.initialize(config)
    
    if (result.success) {
      console.log('✅ Database reinitialized successfully!')
    } else {
      console.error('❌ Database reinitialization failed!')
      console.error('Errors:', result.errors)
      process.exit(1)
    }
  } catch (error) {
    console.error('Database reset and initialization failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { main as initializeDatabase }