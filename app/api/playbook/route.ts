import { getAllPlaybooks, getPlaybookById, createPlaybook, updatePlaybook, deletePlaybook } from "@/lib/db/Playbook";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const playbooks = await getAllPlaybooks();
        if ('error' in playbooks) {
            return NextResponse.json({ error: playbooks.error }, { status: 500 });
        }
        return NextResponse.json(playbooks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch playbooks' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const playbook = await createPlaybook(body);
        if ('error' in playbook) {
            return NextResponse.json({ error: playbook.error }, { status: 500 });
        }
        return NextResponse.json(playbook);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create playbook' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const playbook = await updatePlaybook(body);
        if ('error' in playbook) {
            return NextResponse.json({ error: playbook.error }, { status: 500 });
        }
        return NextResponse.json(playbook);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update playbook' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        const playbook = await deletePlaybook(id);
        if ('error' in playbook) {
            return NextResponse.json({ error: playbook.error }, { status: 500 });
        }
        return NextResponse.json(playbook);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete playbook' }, { status: 500 });
    }
}




