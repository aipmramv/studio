# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas (cloud MongoDB) for the KTI Assets application.

## 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create your account with email/password or Google/GitHub

## 2. Create a New Cluster

1. After logging in, click "Create a New Cluster"
2. Choose the **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Give your cluster a name (e.g., "kti-assets-cluster")
5. Click "Create Cluster" (this may take 3-5 minutes)

## 3. Create Database User

1. In the Atlas dashboard, go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Enter username and password (save these credentials!)
5. For database user privileges, select "Read and write to any database"
6. Click "Add User"

## 4. Configure Network Access

1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, restrict to specific IP addresses
4. Click "Confirm"

## 5. Get Connection String

1. Go to "Clusters" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver and version "4.1 or later"
5. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

## 6. Configure Application

### Option A: Using the Setup Script (Recommended)

1. Run the setup script with your connection string:
   ```bash
   node scripts/setup-mongodb-server.js "mongodb+srv://username:password@cluster0.mongodb.net/kti_assets"
   ```

2. The script will:
   - Test the connection
   - Update your `.env.local` file
   - Provide next steps

### Option B: Manual Configuration

1. Update your `.env.local` file:
   ```env
   # Replace with your actual connection string
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/kti_assets?retryWrites=true&w=majority
   MONGODB_DATABASE=kti_assets
   
   NEXT_PUBLIC_MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/kti_assets?retryWrites=true&w=majority
   NEXT_PUBLIC_MONGO_DB=kti_assets
   ```

2. Replace placeholders:
   - `username`: Your database username
   - `password`: Your database password
   - `cluster0`: Your actual cluster name
   - `kti_assets`: Your database name

## 7. Initialize Database

1. Test the connection:
   ```bash
   node scripts/setup-mongodb-server.js --test
   ```

2. Initialize the database with collections and data:
   ```bash
   node scripts/init-database.js
   ```

3. Verify the setup:
   ```bash
   node scripts/check-database-status.js
   ```

## 8. Start Application

1. Start your Next.js application:
   ```bash
   npm run dev
   ```

2. Visit the database test page:
   ```
   http://localhost:3000/database-test
   ```

## Connection String Examples

### MongoDB Atlas (Recommended)
```
mongodb+srv://username:password@cluster0.mongodb.net/kti_assets?retryWrites=true&w=majority
```

### MongoDB Atlas with App Name
```
mongodb+srv://username:password@cluster0.mongodb.net/kti_assets?retryWrites=true&w=majority&appName=KTI-Assets
```

### Self-hosted MongoDB with SSL
```
mongodb://username:password@your-server.com:27017/kti_assets?ssl=true&authSource=admin
```

### MongoDB Replica Set
```
mongodb://username:password@host1:27017,host2:27017,host3:27017/kti_assets?replicaSet=myReplicaSet
```

## Troubleshooting

### Authentication Failed
- Double-check username and password
- Ensure the database user has proper permissions
- Check if the user is created for the correct database

### Network Timeout
- Verify your IP address is whitelisted in Network Access
- Check your internet connection
- Try allowing access from anywhere (0.0.0.0/0) for testing

### Connection Refused
- Ensure the cluster is running (not paused)
- Check the connection string format
- Verify the cluster name in the connection string

### Database Not Found
- The database will be created automatically on first write
- Ensure you're using the correct database name
- Check if collections are being created properly

## Security Best Practices

### For Production:
1. **Restrict IP Access**: Only allow specific IP addresses
2. **Use Strong Passwords**: Generate complex passwords for database users
3. **Limit User Permissions**: Create users with minimal required permissions
4. **Enable Audit Logs**: Monitor database access and operations
5. **Use Environment Variables**: Never commit credentials to version control
6. **Enable Encryption**: Use TLS/SSL for all connections

### For Development:
1. Use separate clusters for development and production
2. Use different database names for different environments
3. Regularly rotate passwords
4. Monitor usage and costs

## Monitoring and Maintenance

1. **Atlas Dashboard**: Monitor performance, storage, and connections
2. **Alerts**: Set up alerts for high CPU, memory, or connection usage
3. **Backups**: Atlas provides automatic backups for M10+ clusters
4. **Scaling**: Upgrade cluster tier as your application grows

## Cost Optimization

1. **Free Tier**: M0 clusters are free forever (512MB storage, shared CPU)
2. **Pause Clusters**: Pause development clusters when not in use
3. **Monitor Usage**: Keep track of storage and data transfer
4. **Optimize Queries**: Use proper indexes to reduce CPU usage

## Support Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
- [Community Forums](https://community.mongodb.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mongodb-atlas)