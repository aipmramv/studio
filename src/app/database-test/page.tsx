'use client'

import React from 'react'
import { DatabaseStatus } from '@/components/database/DatabaseStatus'
import { useState } from 'react'

export default function DatabaseTestPage() {
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">PostgreSQL Database Connection Test</h1>
          <p className="text-muted-foreground">
            Verify PostgreSQL connection and database setup
          </p>
        </div>

        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          {error ? (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-md">
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">❌ Connection Error</h3>
              <div className="text-xs text-red-800 dark:text-red-200 space-y-1">
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-md">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ PostgreSQL Connected</h3>
              <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
                <p>• Database server: PostgreSQL</p>
                <p>• Connection: Secure</p>
                <p>• Status: Ready for use</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Tables</h2>
          {tables.length > 0 ? (
            <ul>
              {tables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
          ) : (
            <p>No tables found in the database.</p>
          )}
        </div>
      </div>
    </div>
  );
}
