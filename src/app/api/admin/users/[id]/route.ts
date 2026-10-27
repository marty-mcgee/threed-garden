import { auth } from '@/libraries/auth';
import { readAdminUser, updateAdminUserRole } from '@/libraries/services/users/admin';
import { userResponse, userError } from '@/libraries/services/users/http';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,context:Context) {
 try {
  const session=await auth();
  if(!session?.user?.id)return userResponse({error:'Sign in required.'},401);
  return userResponse(await readAdminUser(session.user.id,(await context.params).id));
 }catch(error){return userError(error);}
}
export async function PATCH(request:Request,context:Context) {
 try {
  const session=await auth();
  if(!session?.user?.id)return userResponse({error:'Sign in required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin)return userResponse({error:'Invalid request origin.'},403);
  return userResponse(await updateAdminUserRole(session.user.id,(await context.params).id,await request.json()));
 }catch(error){return userError(error);}
}
