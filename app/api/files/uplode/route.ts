import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

import { v4 as uuidv4 } from "uuid";

//imagekit credentials
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //Parse form data
    const formData = await request.formData();

    const file = formData.get("files") as File;
    const formUserId = formData.get("userId") as string;
    const parentId = (formData.get("parentId") as string) || null;

    if (formUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 401 });
    }

    if (parentId) {
      const [parentFolder] = await db
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, parentId),
            eq(files.userId, userId),
            eq(files.isFolder, true)
          )
        );
    } else {
      return NextResponse.json(
        { error: "Parent folder not found" },
        { status: 401 }
      );
    }

    if (file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only Images and PDF are supported" },
        { status: 401 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    const folderpath = parentId
      ? `/dropPic${userId}/folder/${parentId}`
      : `/dropPic/${userId}`;

    const originalFileName = file.name;
    const fileExtension = originalFileName.split(".").pop() || "";

    // Check for empty extension
    //validation for not storing exe, php
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const uplodeResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: uniqueFileName,
      folder: folderpath,
      useUniqueFileName: false,
    });

    const fileData = {
      name: originalFileName,
      path: uplodeResponse.filePath,
      size: file.size,
      type: file.type,
      fileUrl: uplodeResponse.url,
      thumbnail: uplodeResponse.thumbnailUrl,
      userId: userId,
      parentId: parentId,
      isFolder: false,
      isStarred: false,
      isTrash: false,
    };

    const [newFile] = await db.insert(files).values(fileData).returning();

    return NextResponse.json(newFile);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to uplode the file" },
      { status: 401 }
    );
  }
}
