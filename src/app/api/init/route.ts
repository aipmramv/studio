import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is a public endpoint for initialization
    // No authentication required for basic initialization check
    
    const mongoUri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGO_URI;
    const mongoDb = process.env.MONGODB_DATABASE || process.env.NEXT_PUBLIC_MONGO_DB || 'kti_assets';
    
    if (!mongoUri) {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB URI not configured'
      }, { status: 500 });
    }

    // For client-side initialization, we just return success
    // The actual MongoDB connection happens server-side
    return NextResponse.json({
      status: 'success',
      message: 'Configuration validated',
      database: mongoDb,
      configured: true
    });
  } catch (error: any) {
    console.error('Initialization check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Initialization check failed',
      error: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}