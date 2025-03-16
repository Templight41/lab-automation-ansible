import { NextRequest, NextResponse } from 'next/server';
import { getSystemById } from '@/lib/db/System';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({
        message: 'System ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const system = await getSystemById(id);
    
    if (system.error) {
      return NextResponse.json({
        message: system.error,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    return NextResponse.json(system);
  } catch (error) {
    console.error('Error fetching system:', error);
    return NextResponse.json({
      message: 'Failed to fetch system',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}