import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  status: text("status", { enum: ["ACTIVE", "SUSPENDED"] }).default("ACTIVE").notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastActivityDate: text("lastActivityDate"),
  stripeCustomerId: text("stripeCustomerId").unique(),
  noteId: text("noteId"),
  xId: text("xId"),
  themePreference: text("themePreference", { enum: ["dark", "light"] }).default("dark").notNull(),

  // Lifetime points. Never spent, so it only ever increases; pointEvents is
  // the ledger it is derived from.
  totalPoints: integer("totalPoints").default(0).notNull(),

  // Subscription / membership
  planId: text("planId").references(() => plans.id),
  stripeSubscriptionId: text("stripeSubscriptionId").unique(),
  subscriptionStatus: text("subscriptionStatus", { enum: ["NONE", "ACTIVE", "PAST_DUE", "CANCELED"] }).default("NONE").notNull(),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }),
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
  issuer: text("issuer"),
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

// Persistent storage for better-auth's rate limiter. Memory storage (the
// default) doesn't survive across Workers isolates, so this backs it with D1.
export const rateLimit = sqliteTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  lastRequest: integer("lastRequest").notNull(),
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
  categoryId: text("categoryId"),

  status: text("status", { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }).default("DRAFT").notNull(),
  badge: text("badge"),
  totalDuration: integer("totalDuration").default(0).notNull(),
  lessonCount: integer("lessonCount").default(0).notNull(),

  // Access control: null = visible to any active (paid) member.
  // Set = only members on this plan (or with a matching enrollment) can access.
  requiredPlanId: text("requiredPlanId").references(() => plans.id, { onDelete: "set null" }),

  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("videoUrl"),
  content: text("content"),
  duration: integer("duration").default(0),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("lessons_courseId_idx").on(t.courseId),
]);

// ========================
//  Membership Plans (Stripe Subscriptions)
// ========================

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").default(0).notNull(), // yen, per interval
  interval: text("interval", { enum: ["month", "year"] }).default("month").notNull(),
  stripeProductId: text("stripeProductId"),
  stripePriceId: text("stripePriceId").unique(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
});

// ========================
//  Per-course bonus resources ("tool group" attached to a course)
// ========================

export const courseResources = sqliteTable("courseResources", {
  id: text("id").primaryKey(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  icon: text("icon").default('📄').notNull(),
  title: text("title").notNull(),
  description: text("description"),

  // A resource is delivered either as an external link (Notion, a video) or
  // as a file held in R2. objectKey is never exposed to the browser: members
  // are sent through a download route that checks course access and mints a
  // short-lived signed URL, so a forwarded link does not leak the file.
  fileUrl: text("fileUrl"),
  objectKey: text("objectKey"),
  fileName: text("fileName"),
  fileSize: integer("fileSize"),

  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  index("courseResources_courseId_idx").on(t.courseId),
]);

// ========================
//  Bookmarks
// ========================

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  createdAt: text("createdAt").notNull(),
}, (t) => [
  // One bookmark per member per course; also the index the bookmarks page uses.
  uniqueIndex("bookmarks_userId_courseId_unique").on(t.userId, t.courseId),
]);

export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  courseId: text("courseId").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  progress: real("progress").default(0).notNull(),
  startedAt: text("startedAt").notNull(),
  completedAt: text("completedAt"),
}, (t) => [
  uniqueIndex("enrollments_userId_courseId_unique").on(t.userId, t.courseId),
]);

export const lessonProgress = sqliteTable("lessonProgress", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => user.id, { onDelete: "cascade" }).notNull(),
  lessonId: text("lessonId").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  isCompleted: integer("isCompleted", { mode: "boolean" }).default(false).notNull(),
  watchedSeconds: integer("watchedSeconds").default(0).notNull(),
  completedAt: text("completedAt"),
}, (t) => [
  // The progress upsert reads by this pair before writing; unique also stops
  // a concurrent toggle creating two rows for one lesson.
  uniqueIndex("lessonProgress_userId_lessonId_unique").on(t.userId, t.lessonId),
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
});

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  postId: text('postId').references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
  // Unique: Stripe redelivers checkout.session.completed until it gets a 2xx,
  // and one Checkout Session must never grant access twice.
  stripeSessionId: text('stripeSessionId').notNull().unique(),
  amount: integer('amount').notNull(),
  purchasedAt: text('purchasedAt').notNull(),
}, (t) => [
  index('purchases_userId_postId_idx').on(t.userId, t.postId),
]);

// One row per Stripe event id we have finished processing. The row is written
// before handling and removed again if handling throws, so a redelivery of a
// failed event is still retried while a redelivery of a successful one is not.
export const webhookEvents = sqliteTable('webhookEvents', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  receivedAt: text('receivedAt').notNull(),
});


// ========================
//  Gamification
// ========================

// Append-only ledger of every point award. user.totalPoints is the running
// sum; keeping the individual events means a member can be shown what they
// earned and why, and the total can be rebuilt if it ever drifts.
export const pointEvents = sqliteTable('pointEvents', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', {
    enum: ['LESSON_COMPLETE', 'COURSE_COMPLETE', 'STREAK_BONUS'],
  }).notNull(),
  points: integer('points').notNull(),
  courseId: text('courseId'),
  lessonId: text('lessonId'),
  createdAt: text('createdAt').notNull(),
}, (t) => [
  index('pointEvents_userId_createdAt_idx').on(t.userId, t.createdAt),
]);

export const userBadges = sqliteTable('userBadges', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  badgeId: text('badgeId').notNull(),
  earnedAt: text('earnedAt').notNull(),
}, (t) => [
  // A badge is earned once.
  uniqueIndex('userBadges_userId_badgeId_unique').on(t.userId, t.badgeId),
]);

// ========================
//  Site Settings (Admin)
// ========================

export const siteSettings = sqliteTable('siteSettings', {
  id: text('id').primaryKey(),
  siteName: text('siteName').default('N8N MARKETING').notNull(),
  logoUrl: text('logoUrl'),
  accentColor: text('accentColor').default('gold').notNull(),
  bgPattern: text('bgPattern').default('pattern1').notNull(),

  // Legal / operator info — backs the auto-generated 特定商取引法に基づく表記,
  // and the editable 利用規約 / プライバシーポリシー pages.
  operatorName: text('operatorName'),
  operatorRepresentative: text('operatorRepresentative'),
  operatorAddress: text('operatorAddress'),
  operatorPhone: text('operatorPhone'),
  operatorEmail: text('operatorEmail'),
  tokushohoExtra: text('tokushohoExtra'),
  termsContent: text('termsContent'),
  privacyContent: text('privacyContent'),

  updatedAt: text('updatedAt').notNull(),
});

