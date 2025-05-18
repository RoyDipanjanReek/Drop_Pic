import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";

import { NextRequest, NextResponse } from "next/server";

//Image Kit Credentials are here----------
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});
//Image Kit Credentials are here----------

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await props.params;

    if (!fileId) {
      return NextResponse.json(
        { error: "File Id is required" },
        { status: 401 }
      );
    }

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 401 });
    }

    // Delete file form imageKit if it not a folder

    if (!file.isFolder) {
      try {
        let fileIdInImagekit = null;

        if (file.fileUrl) {
          const urlWithoutQuery = file.fileUrl.split("?")[0];
          fileIdInImagekit = urlWithoutQuery.split("/").pop();
        }

        if (!fileIdInImagekit && file.path) {
          fileIdInImagekit = file.path.split("/").pop();
        }

        if (fileIdInImagekit) {
          try {
            const searchResult = await imagekit.listFiles({
              name: fileIdInImagekit,
              limit: 1,
            });

            if (searchResult && searchResult.length > 0) {
              await imagekit.deleteFile(searchResult[0].name);
            } else {
              await imagekit.deleteFile(fileIdInImagekit);
            }
          } catch (searchError) {
            console.error(
              `Error searching for file in ImageKit:-`,
              searchError
            );
            await imagekit.deleteFile(fileIdInImagekit);
          }
        }
      } catch (error) {
        console.error(`Error to delete file`, error);
      }
    }

    const [deleteFile] = await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      deleteFile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
