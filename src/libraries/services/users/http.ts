import { ZodError } from 'zod';
import { UserAdminError } from './admin';
import { RegistrationConflict } from '@/libraries/auth/register';
export const userResponse=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export function userError(error:unknown) {
 if(error instanceof UserAdminError)return userResponse({error:error.message},error.status);
 if(error instanceof RegistrationConflict)return userResponse({error:'This email is already in use, including retained deleted accounts.'},409);
 if(error instanceof ZodError || error instanceof SyntaxError)return userResponse({error:'Invalid User request.'},400);
 return userResponse({error:'Users request failed. Check the Users schema prerequisites before retrying.'},503);
}
export async function readUserRequest(request: Request) {
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new UserAdminError(403,'Invalid request origin.');
 const reader=request.body?.getReader();
 if(!reader)throw new UserAdminError(400,'Invalid User request.');
 const chunks:Uint8Array[]=[];let size=0;
 try {
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
   if(size>4096){await reader.cancel();throw new UserAdminError(413,'User request is too large.');}chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
 }finally{reader.releaseLock();}
}
