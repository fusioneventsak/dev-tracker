import { NextResponse } from 'next/server';
import { getAllStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getAllStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
