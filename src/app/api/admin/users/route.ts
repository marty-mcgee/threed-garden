import { auth } from '@/libraries/auth';
import { listAdminUsers, createAdminUser } from '@/libraries/services/users/admin';
import { userResponse, userError, readUserRequest } from '@/libraries/services/users/http';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 try {
  const session=await auth();
  if(!session?.user?.id)return userResponse({error:'Sign in required.'},401);
  return userResponse(await listAdminUsers(session.user.id,Object.fromEntries(new URL(request.url).searchParams)));
 } catch(error) {return userError(error);}
}
export async function POST(request:Request) {
 try {
  const session=await auth();
  if(!session?.user?.id)return userResponse({error:'Sign in required.'},401);
  return userResponse(await createAdminUser(session.user.id,await readUserRequest(request)),201);
 }catch(error){return userError(error);}
}
