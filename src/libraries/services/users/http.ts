import { ZodError } from 'zod';
import { UserAdminError } from './admin';
export const userResponse=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export function userError(error:unknown) {
 if(error instanceof UserAdminError)return userResponse({error:error.message},error.status);
 if(error instanceof ZodError || error instanceof SyntaxError)return userResponse({error:'Invalid User request.'},400);
 return userResponse({error:'Users request failed. No role change was saved. Check the User role audit schema prerequisite before retrying.'},503);
}
