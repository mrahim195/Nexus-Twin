import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "@nexus-twin/database";
import { db } from "@/lib/mongo";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(128).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await db();
    const existing = await UserModel.findOne({
      email: body.email.toLowerCase(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await UserModel.create({
      email: body.email.toLowerCase(),
      name: body.name || body.email.split("@")[0],
      passwordHash,
    });
    return NextResponse.json({
      id: String(user._id),
      email: user.email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
