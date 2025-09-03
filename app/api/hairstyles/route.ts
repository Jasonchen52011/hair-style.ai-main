import { NextResponse } from 'next/server';
import hairstylesData from '@/data/hairstyles-data.json';

export async function GET() {
  try {
    return NextResponse.json(hairstylesData.hairstyles);
  } catch (error) {
    console.error('Error fetching hairstyles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hairstyles' },
      { status: 500 }
    );
  }
}