import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET() {
    const filePath = path.join(process.cwd(), "public/update-system.sh");
    console.log(filePath);
    try {
        const fileBuffer = await readFile(filePath);
        const headers = {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="update-system.sh"`,
        };
        return new NextResponse(fileBuffer, { status: 200, headers });
    } catch (error) {
        console.error(error);
        return new NextResponse("File not found", { status: 404 });
    }
}