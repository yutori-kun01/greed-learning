import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema';
import { courses, lessons, blogPosts } from '../src/db/schema';

const sqlite = new Database('local-dev.db');
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo courses
  const courseId1 = crypto.randomUUID();
  const courseId2 = crypto.randomUUID();

  db.insert(courses).values([
    {
      id: courseId1,
      number: 1,
      title: 'フロントエンド開発入門',
      description: 'Next.jsとReactを使ったモダンなWeb開発の基礎を学びます。',
      status: 'PUBLISHED',
      categoryId: 'TECH',
      badge: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: courseId2,
      number: 2,
      title: 'デジタルマーケティング戦略',
      description: 'SEOとコンテンツマーケティングの実践的な手法をマスターします。',
      status: 'PUBLISHED',
      categoryId: 'MARKETING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]).run();

  // Create demo lessons
  db.insert(lessons).values([
    {
      id: crypto.randomUUID(),
      courseId: courseId1,
      number: 1,
      title: 'Reactフックの基礎',
      content: '<p>useStateとuseEffectの使い方を学びましょう。</p>',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // example video
      sortOrder: 1,
      isPublished: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      courseId: courseId1,
      number: 2,
      title: 'Next.js App Router',
      content: '<p>サーバーコンポーネントとルーティングの仕組みを解説します。</p>',
      sortOrder: 2,
      isPublished: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]).run();

  // Create demo blog posts
  db.insert(blogPosts).values([
    {
      id: crypto.randomUUID(),
      slug: 'getting-started-with-nextjs',
      title: 'Next.js 14 の新機能まとめ',
      content: '<p>Next.js 14 がリリースされました！<br/>以下に主な新機能をまとめます。</p><div data-type="paywall-line"></div><p>ここから先は有料会員限定です。</p><p>Server Actions の詳細な使い方について...</p>',
      status: 'PAID',
      price: 980,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      slug: 'marketing-trends-2026',
      title: '2026年のマーケティングトレンド',
      content: '<p>今年のトレンドは AI 活用です。</p>',
      status: 'PUBLISHED',
      price: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }
  ]).run();

  console.log('✅ Seeding complete!');
}

seed().catch(console.error);
