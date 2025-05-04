import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //Parse request body
    const body = await request.json();
    const { imagekit, userId: bodyUserId } = body;

    if (bodyUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!imagekit || !imagekit.url) {
      return NextResponse.json(
        { error: "Invalid file uplode data" },
        { status: 401 }
      );
    }

    const fileData = {
      name: imagekit.name || "Untitled",
      path: imagekit.filePath || `/drop_pic/${userId}/${imagekit.name}`,
      size: imagekit.size || 0,
      type: imagekit.fileType || "image",
      fileUrl: imagekit.url,
      thumbnail: imagekit.thumbnail || null,
      userId: userId,
      parentId: null,
      isFolder: false,
      isStarred: false,
      isTrash: false,
    };

    const [NewFile] = await db.insert(files).values(fileData).returning();

    return NextResponse.json(NewFile);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save data into imagekit" },
      { status: 500 }
    );
  }
}
