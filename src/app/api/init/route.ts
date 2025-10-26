import { NextRequest, NextResponse } from 'next/server';
import { initializeMongo } from '@/mongo/mongo';

export async function GET(request: NextRequest) {
  try {
    // Initialize MongoDB connection
    const mongoUri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGO_URI;
    const mongoDb = process.env.MONGODB_DATABASE || process.env.NEXT_PUBLIC_MONGO_DB || 'kti_assets';
    
    if (!mongoUri) {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB URI not configured'
      }, { status: 500 });
    }

    // Initialize MongoDB
    await initializeMongo(mongoUri, mongoDb);
    
    return NextResponse.json({
      status: 'success',
      message: 'MongoDB initialized successfully',
      database: mongoDb
    });
  } catch (error: any) {
    console.error('MongoDB initialization failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'MongoDB initialization failed',
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}