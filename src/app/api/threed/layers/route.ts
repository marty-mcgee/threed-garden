import { NextResponse } from 'next/server';

function retired() {
  return NextResponse.json({ success: false, error: 'Layer records are retired. Use Scene Visibility in the Scene toolbar.' }, { status: 410 });
}

export { retired as GET, retired as POST, retired as PUT, retired as PATCH, retired as DELETE };
