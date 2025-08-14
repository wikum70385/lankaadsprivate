import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_AD_BACKEND_URL || "http://localhost:3001/api";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`${API_URL}/ads/${id}`);
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
