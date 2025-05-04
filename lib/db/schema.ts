import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  //basic file/ folder information
  name: text("name").notNull(),
  path: text("path").notNull(), // document/project/resume
  size: integer("size").notNull(),
  type: text("text").notNull(), // folder

  // storage information
  fileUrl: text("file_url").notNull(), //url to access file
  thumbnail: text("thumbnail"),

  // Ownership information
  userId: text("user_id").notNull(),
  parentId: uuid("parent_Id"), //Parent folder if(null for root items)

  //file/folder flags
  isFolder: boolean("is_Folder").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isTrash: boolean("is_trashed").default(false).notNull(),

  //Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 Parent: Each file/ folder can have one parent folder

Childern: Each folder can have many child files/folder
 */

export const filesRelations = relations(files, ({ one, many }) => ({
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),

  //relationship to child file/folder
  children: many(files),
}));

// Type defination

export const File = typeof files.$inferSelect;
export const NewFile = typeof files.$inferInsert;
