import { NextResponse } from "next/server";
import { createPairingCodeSchema } from "@nexus-twin/validation";
import { PairingCodeModel } from "@nexus-twin/database";
import { requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import { generatePairingCode } from "@/lib/device-utils";

export async function POST(req: Request) {
  const auth = await requireUserSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = createPairingCodeSchema.parse(await req.json().catch(() => ({})));
    await db();
    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await PairingCodeModel.create({
      ownerId: auth.userId,
      code,
      label: body.label,
      expiresAt,
    });
    return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create pairing code" }, { status: 400 });
  }
}
