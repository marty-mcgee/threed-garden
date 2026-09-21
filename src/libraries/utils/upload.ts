import { put } from '@vercel/blob';

export async function uploadImage(file: File, userId: string, albumId: number): Promise<string> {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const filename = `music/media/${userId}/${albumId}/${timestamp}.${extension}`;
  
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });
  
  return blob.url;
}