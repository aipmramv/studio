import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Simple authentication for admin users
    const isAdminEmail = email === 'admin@example.com' || email === 'aipm.ramv@gmail.com';
    const isAdminPassword = password === 'admin123';
    
    if (isAdminEmail && isAdminPassword) {
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      return NextResponse.json({
        success: true,
        user: {
          id: email === 'admin@example.com' ? 'admin-1' : 'admin-2',
          email: email,
          role: 'admin',
          displayName: email === 'aipm.ramv@gmail.com' ? 'Ram Kumar V' : 'Default Admin',
          department: 'IT'
        },
        token: sessionToken
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 });
    
  } catch (error: any) {
    console.error('Simple login failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}