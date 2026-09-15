import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ownerPrefix, ownsMediaKey, uploadPolicy } from '@/lib/services/music/upload-policy';

const headers = { 'Cache-Control': 'private, no-store' };
function storage() {
  if (!process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) throw Error('Storage not configured');
  return { client: new S3Client({
    region: process.env.AWS_REGION,
    // The file body is sent later by the browser, not available while signing.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  }), bucket: process.env.S3_BUCKET_NAME };
}
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in to upload.' }, { status: 401, headers });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400, headers }); }
  let policy;
  try {
    if (!body || typeof body.name !== 'string') throw Error();
    policy = uploadPolicy(body.name, body.size, body.kind);
  } catch { return NextResponse.json({ error: 'Choose supported audio/video up to 512 MiB or cover art up to 20 MiB.' }, { status: 400, headers }); }
  try {
    const { client, bucket } = storage();
    if (body.action === 'complete') {
      if (typeof body.key !== 'string' || !ownsMediaKey(session.user.id, body.key) || !body.key.endsWith(`/${body.name}`)) {
        return NextResponse.json({ error: 'Invalid upload reference.' }, { status: 400, headers });
      }
      const object = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: body.key }));
      if (object.ContentLength !== body.size || object.ContentType !== policy.contentType) {
        return NextResponse.json({ error: 'Uploaded file could not be verified.' }, { status: 409, headers });
      }
      return NextResponse.json({ fileUrl: `/api/music/files?key=${encodeURIComponent(body.key)}`, fileType: policy.contentType, fileSize: object.ContentLength }, { headers });
    }
    if (body.action !== 'start') return NextResponse.json({ error: 'Invalid upload action.' }, { status: 400, headers });
    const key = `${ownerPrefix(session.user.id)}${crypto.randomUUID()}/${body.name}`;
    const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key,
      ContentType: policy.contentType, ContentLength: body.size,
    }), { expiresIn: 900 });
    return NextResponse.json({ url, key, contentType: policy.contentType }, { headers });
  } catch {
    return NextResponse.json({ error: 'S3 upload unavailable. Check bucket region, credentials and permissions.' }, { status: 503, headers });
  }
}
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401, headers });
  const key = request.nextUrl.searchParams.get('key') || '';
  if (!ownsMediaKey(session.user.id, key)) return new NextResponse(null, { status: 404, headers });
  try {
    const { client, bucket } = storage();
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: 'inline' }), { expiresIn: 900 });
    return new NextResponse(null, { status: 307, headers: { ...headers, Location: url } });
  } catch { return new NextResponse(null, { status: 503, headers }); }
}
