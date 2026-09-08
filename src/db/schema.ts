import { sqliteTable, text, integer, real, blob, index } from "drizzle-orm/sqlite-core";

// ========================
//  Better Auth Required
// ========================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  
  // Custom fields
  role: text("role", { enum: ["ADMIN", "MEMBER"] }).default("MEMBER").notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastActivityDate: text("lastActivityDate"),
  stripeCustomerId: text("stripeCustomerId").unique(),
  noteId: text("noteId"),
  xId: text("xId"),
  themePreference: text("themePreference", { enum: ["dark", "light"] }).default("dark").notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

// ========================
//  Categories & Resources
// ========================

export const courseCategories = sqliteTable("courseCategories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sortOrder").default(0).notNull(),
});

export const resources = sqliteTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  fileUrl: text("fileUrl"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }), // nullable, if null it's a global resource
});

// ========================
//  Courses & Learning
// ========================

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  categoryId: text("categoryId").references(() => courseCategories.id), // updated reference
  
  status: text("status", { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }).default("DRAFT").notNull(),
  badge: text("badge"),
  totalDuration: integer("totalDuration").default(0).notNull(),
  lessonCount: integer("lessonCount").default(0).notNull(),
  
  isFreeForMembers: integer("isFreeForMembers", { mode: "boolean" }).default(false).notNull(), // New field
  
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
}, (t) => [
  index("courses_status_idx").on(t.status)
]);

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"), // New field
  content: text("content"),
  duration: integer("duration").default(0),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
});

export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  progress: real("progress").default(0).notNull(),
  startedAt: text("startedAt").notNull(),
  completedAt: text("completedAt"),
});

export const lessonProgress = sqliteTable("lessonProgress", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  lessonId: text("lessonId").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  isCompleted: integer("isCompleted", { mode: "boolean" }).default(false).notNull(),
  watchedSeconds: integer("watchedSeconds").default(0).notNull(),
  completedAt: text("completedAt"),
}, (t) => [
  index("lessonProgress_userId_lessonId_idx").on(t.userId, t.lessonId)
]);

// ========================
//  Plans & Access Grants (New)
// ========================

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").default(0).notNull(),
  stripeProductId: text("stripeProductId"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const planCourses = sqliteTable("planCourses", {
  planId: text("planId").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
}, (t) => [
  index("planCourses_idx").on(t.planId, t.courseId)
]);

export const userAccessGrants = sqliteTable("userAccessGrants", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }), // if null, check planId
  planId: text("planId").references(() => plans.id, { onDelete: "cascade" }), // if null, check courseId
  grantedAt: text("grantedAt").notNull(),
}, (t) => [
  index("userAccessGrants_user_idx").on(t.userId)
]);

// ========================
//  Blog & Content
// ========================

export const blogPosts = sqliteTable("blogPosts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImageUrl: text("coverImageUrl"),
  
  status: text("status", { enum: ["DRAFT", "PUBLISHED", "MEMBERS_ONLY", "PAID"] }).default("DRAFT").notNull(),
  stripePriceId: text("stripePriceId"),
  price: integer("price").default(0),
  
  authorId: text("authorId").references(() => user.id),
  publishedAt: text("publishedAt"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
}, (t) => [
  index("blogPosts_status_idx").on(t.status),
  index("blogPosts_slug_idx").on(t.slug)
]);

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  postId: text('postId').references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
  stripeSessionId: text('stripeSessionId').notNull().unique(),
  amount: integer('amount').notNull(),
  purchasedAt: text('purchasedAt').notNull(),
});


// ========================
//  Site Settings (Admin)
// ========================

export const siteSettings = sqliteTable('siteSettings', {
  id: text('id').primaryKey(),
  siteName: text('siteName').default('N8N MARKETING').notNull(),
  logoUrl: text('logoUrl'),
  accentColor: text('accentColor').default('gold').notNull(),
  bgPattern: text('bgPattern').default('pattern1').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

