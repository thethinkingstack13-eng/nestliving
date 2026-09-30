import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createCloudinaryUploadSignature, type ImagePurpose } from '@/lib/cloudinary';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in to upload images.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const purpose = body?.purpose as ImagePurpose | undefined;
  if (
    (purpose === 'avatar' && session.role !== 'TENANT') ||
    (purpose === 'property' && session.role !== 'OWNER') ||
    (purpose !== 'avatar' && purpose !== 'property')
  ) {
    return NextResponse.json({ message: 'Image upload is not allowed for this account.' }, { status: 403 });
  }

  try {
    return NextResponse.json(createCloudinaryUploadSignature(session.userId, purpose));
  } catch {
    return NextResponse.json({ message: 'Image storage is temporarily unavailable.' }, { status: 503 });
  }
}