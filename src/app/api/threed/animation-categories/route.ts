import { NextRequest } from 'next/server';
import { animationResponse } from '@/lib/services/threed/animations/http';
import { positiveId } from '@/lib/services/threed/animations/contracts';
import { listCategories, saveCategory, deleteCategory, assignCategories } from '@/lib/services/threed/animations/categories';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() { return animationResponse(listCategories); }
export function POST(request: NextRequest) { return animationResponse(async userId => saveCategory(userId, await request.json().catch(() => null))); }
export function PUT(request: NextRequest) { return animationResponse(async userId => assignCategories(userId, await request.json().catch(() => null))); }
export function DELETE(request: NextRequest) { return animationResponse(userId => deleteCategory(userId, positiveId(request.nextUrl.searchParams.get('id')))); }
