import { NextResponse } from 'next/server';
import { deleteSystem, getAllSystems, updateSystem } from '@/lib/db/System';

export async function GET() {
    const inventory = await getAllSystems();
    
    return NextResponse.json({
        message: 'Inventory fetched successfully',
        timestamp: new Date().toISOString(),
        inventory
    });
}

export async function PUT(request: Request) {
    const { lab, address, id } = await request.json();
    const inventory = await updateSystem({ lab, address, id });
    if(inventory.error) {
        return NextResponse.json({
            message: inventory.error,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
    return NextResponse.json({
        message: `Inventory updated: ${inventory.lab} - ${inventory.address}`
    });
}

export async function DELETE(request: Request) {
    const { id } = await request.json();
    const inventory = await deleteSystem(id);
    if(inventory.error) {
        return NextResponse.json({
            message: inventory.error,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
    return NextResponse.json({
        message: `Inventory deleted: ${id}`,
        timestamp: new Date().toISOString()
    });
}