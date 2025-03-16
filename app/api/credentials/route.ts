import { NextResponse } from 'next/server';
import { getAllCredentials, createCredential, updateCredential, deleteCredential } from '@/lib/db/Credential';
import { v4 as uuid } from 'uuid';

export async function GET() {
    try {
        const credentials = await getAllCredentials();
        if ('error' in credentials) {
            return NextResponse.json({ error: credentials.error }, { status: 500 });
        }
        return NextResponse.json(credentials);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { lab, username, password, id = uuid() } = await request.json();
        const credentials = await createCredential({ id, lab, username, password });
        if ('error' in credentials) {
            return NextResponse.json({ error: credentials.error }, { status: 500 });
        }
        return NextResponse.json(credentials);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create credentials' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { lab, username, password } = await request.json();
        const credentials = await updateCredential({ lab, username, password });
        if ('error' in credentials) {
            return NextResponse.json({ error: credentials.error }, { status: 500 });
        }
        return NextResponse.json(credentials);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { lab } = await request.json();
        const credentials = await deleteCredential(lab);
        if ('error' in credentials) {
            return NextResponse.json({ error: credentials.error }, { status: 500 });
        }
        return NextResponse.json(credentials);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 });
    }
}