import { NextResponse } from 'next/server';
import { createSystem } from '@/lib/db/System';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { lab, address } = await request.json();
        
        // Validate required fields
        if (!lab || !address) {
            return NextResponse.json({
                message: 'Lab name and address are required',
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }
        
        // Create a new system with a generated ID
        const newSystem = await createSystem({ 
            id: uuidv4(), 
            lab, 
            address 
        });
        
        if (newSystem.error) {
            return NextResponse.json({
                message: newSystem.error,
                timestamp: new Date().toISOString()
            }, { status: 500 });
        }
        
        return NextResponse.json({
            message: `System created: ${newSystem.lab}`,
            system: newSystem
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating system:', error);
        return NextResponse.json({
            message: 'Failed to create system',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 