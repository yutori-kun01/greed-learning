import { NextResponse } from 'next/server';
import { akinaiConfig } from '@/lib/akinai';

// The login page is a client component; this tells it whether to offer
// "Akinai hubでログイン" without baking the setting in at build time.
export async function GET() {
  return NextResponse.json({ enabled: !!akinaiConfig() }, { headers: { 'Cache-Control': 'no-store' } });
}
