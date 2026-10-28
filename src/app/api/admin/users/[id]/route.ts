import { auth } from '@/libraries/auth';
import { readAdminUser, updateAdminUserRole, updateAdminUser, softDeleteAdminUser } from '@/libraries/services/users/admin';
import { userResponse, userError, readUserRequest } from '@/libraries/services/users/http';
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
  const input=await readUserRequest(request);
  const profile=typeof input==='object'&&input!==null&&('name' in input||'email' in input);
  return userResponse(await (profile?updateAdminUser:updateAdminUserRole)(session.user.id,(await context.params).id,input));
 }catch(error){return userError(error);}
}
export async function DELETE(request:Request,context:Context) {
 try {
  const session=await auth();
  if(!session?.user?.id)return userResponse({error:'Sign in required.'},401);
  return userResponse(await softDeleteAdminUser(session.user.id,(await context.params).id,await readUserRequest(request)));
 }catch(error){return userError(error);}
}
