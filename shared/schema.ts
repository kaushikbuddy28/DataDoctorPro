import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user table stays the same
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Dataset table to store uploaded files and their processed results
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  fileType: text("file_type").notNull(), // csv, xls, xlsx
  createdAt: text("created_at").notNull(), // ISO string for simplicity
  rawData: jsonb("raw_data").notNull(),
  cleanedData: jsonb("cleaned_data"),
  cleaningStats: jsonb("cleaning_stats"),
  isProcessed: boolean("is_processed").default(false),
  savedProjectName: text("saved_project_name"),
});

// Schema for inserting a dataset
export const insertDatasetSchema = createInsertSchema(datasets)
  .omit({ 
    id: true, 
    cleanedData: true, 
    cleaningStats: true, 
    isProcessed: true,
    savedProjectName: true 
  });

// Schema for processing options
export const processingOptionsSchema = z.object({
  removeOutliers: z.boolean().default(false),
  fixDataTypes: z.boolean().default(true),
  standardizeColumnNames: z.boolean().default(true),
  missingValueStrategy: z.enum(["mean", "median", "mode", "constant"]).default("mean"),
  constantValue: z.string().optional(),
});

// Schema for updating a dataset with processing results
export const updateDatasetSchema = createInsertSchema(datasets)
  .pick({
    cleanedData: true,
    cleaningStats: true,
    isProcessed: true,
    savedProjectName: true
  })
  .partial();

// For API request to save project
export const saveProjectSchema = z.object({
  datasetId: z.number(),
  projectName: z.string().min(1, "Project name is required"),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasets.$inferSelect;
export type ProcessingOptions = z.infer<typeof processingOptionsSchema>;
export type UpdateDataset = z.infer<typeof updateDatasetSchema>;
export type SaveProject = z.infer<typeof saveProjectSchema>;

// User schema from previous file
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
