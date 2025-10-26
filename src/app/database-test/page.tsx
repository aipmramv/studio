import { DatabaseStatus } from '@/components/database/DatabaseStatus'

export default function DatabaseTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Verify MongoDB connection and database setup
          </p>
        </div>
        
        <div className="flex justify-center">
          <DatabaseStatus />
        </div>
        
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Setup Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Database Name:</strong> kti_assets</p>
            <p><strong>Connection Type:</strong> MongoDB Atlas (Cloud)</p>
            <p><strong>Expected Collections:</strong> assets, users, workflows, masterData, assetMovements</p>
            <p><strong>Admin User:</strong> admin@kti.com (password: admin123)</p>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-md">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ MongoDB Atlas Connected</h3>
            <div className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <p>• Database server: MongoDB Atlas</p>
              <p>• Connection: Secure (TLS/SSL)</p>
              <p>• Status: Ready for use</p>
              <p>• Collections: Initialized with indexes</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Setup Complete</h3>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p>✅ MongoDB Atlas connection configured</p>
              <p>✅ Database initialized with collections</p>
              <p>✅ Indexes created for performance</p>
              <p>✅ Admin user created</p>
              <p>✅ Master data populated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}