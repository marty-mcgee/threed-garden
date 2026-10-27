import { UsersWorkspace } from '@/components/admin/users/UsersWorkspace';
export default async function Page({params}:{params:Promise<{id:string}>}){return <UsersWorkspace userId={(await params).id} />;}
