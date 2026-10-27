'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Users, Pencil, RefreshCw, ShieldCheck } from 'lucide-react';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModuleIcon } from '@/components/settings/ModuleAppearanceProvider';
import { ModelFieldHelp } from '@/components/admin/threed/models/ModelFieldHelp';
import type { AdminUserRecord } from '@/libraries/services/users/contracts';

const selectStyle='h-7 min-w-0 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:min-h-11';
const actionStyle='h-7 gap-1.5 px-2 text-xs [@media(pointer:coarse)]:min-h-11';
const roleLabel=(value:string|null)=>value==='super_admin'?'Super Admin':value==='admin'?'Admin':value==='user'?'Legacy User':value||'Unassigned';
export function UsersWorkspace({userId}:{userId?:string}) {
 const {data:session,status}=useSession();
 const owner=session?.user?.id;
 const [storedRecords,setRecords]=useState<AdminUserRecord[]>([]);
 const [storedRecord,setRecord]=useState<AdminUserRecord|null>(null);
 const [loadedKey,setLoadedKey]=useState('');
 const viewKey=String(owner)+':'+(userId??'list');
 const record=loadedKey===viewKey?storedRecord:null;
 const records=loadedKey===viewKey?storedRecords:[];
 const [role,setRole]=useState('');
 const [search,setSearch]=useState('');
 const [filter,setFilter]=useState('all');
 const [page,setPage]=useState(1);
 const [total,setTotal]=useState(0);
 const [refresh,setRefresh]=useState(0);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const sequence=useRef(0);
 const identity=useRef(owner);identity.current=owner;
 const dirty=!!record&&role!==(record.role??'');
 useEffect(()=>{
  const generation=++sequence.current;
  const controller=new AbortController();
  setRecord(null);setRecords([]);setLoading(true);setError('');setMessage('');setSaving(false);
  if(status==='loading')return ()=>controller.abort();
  if(!owner){setLoading(false);setError('Sign in required.');return ()=>controller.abort();}
  const query=new URLSearchParams({search,role:filter,page:String(page)});
  const url=userId?'/api/admin/users/'+encodeURIComponent(userId):'/api/admin/users?'+query;
  const timer=setTimeout(()=>{void fetch(url,{signal:controller.signal,cache:'no-store'}).then(async response=>{
   const value=await response.json();if(!response.ok)throw new Error(value.error||'Users could not be loaded.');
   if(generation!==sequence.current||identity.current!==owner)return;
   setLoadedKey(String(owner)+':'+(userId??'list'));
   if(userId){setRecord(value);setRole(value.role??'');}else{setRecords(value.data);setTotal(value.total);}
  }).catch(reason=>{if(!controller.signal.aborted&&generation===sequence.current)setError(reason.message);})
   .finally(()=>{if(!controller.signal.aborted&&generation===sequence.current)setLoading(false);});},userId?0:200);
  return ()=>{controller.abort();clearTimeout(timer);};
 },[owner,status,userId,search,filter,page,refresh]);
 useEffect(()=>{
  if(!dirty&&!saving)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  const guard=(event:MouseEvent)=>{const link=(event.target as Element).closest?.('a[href]');if(link&&(saving||!window.confirm('Discard unsaved role changes?'))){event.preventDefault();event.stopPropagation();}};
  window.addEventListener('beforeunload',warn);document.addEventListener('click',guard,true);
  return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',guard,true);};
 },[dirty,saving]);
 async function save(){
  if(!record||saving||!dirty)return;
  const generation=sequence.current;const currentOwner=owner;
  setSaving(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/admin/users/'+encodeURIComponent(record.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({role,revision:record.revision})});
   const value=await response.json();if(!response.ok)throw new Error(value.error||'Role could not be saved.');
   if(generation!==sequence.current||identity.current!==currentOwner)return;
   setRecord(value);setRole(value.role);setMessage('Role saved.');
   if(value.id===currentOwner&&value.role!=='super_admin')window.location.assign('/admin');
  }catch(reason){if(generation===sequence.current&&identity.current===currentOwner)setError(reason instanceof Error?reason.message:'Role could not be saved.');}
  finally{if(generation===sequence.current&&identity.current===currentOwner)setSaving(false);}
 }
 return <div className="flex h-full min-h-0 flex-col gap-2">
  <AdminWorkspaceHeader moduleKey="users" icon={Users} title={userId?'Edit User Role':'Users'} description="Manage roles for existing User accounts." className="shrink-0">
   <ModelFieldHelp label="Users">Super Admins manage User roles and global Module styling. Admins manage their own content.</ModelFieldHelp>
   {!userId&&<>
    <Badge variant="outline" className="text-[10px]">{loading?'...':total}</Badge>
    <Input aria-label="Search Users" className="h-7 w-full text-xs sm:w-60" placeholder="Search name or email..." value={search} maxLength={100} onChange={event=>{setSearch(event.target.value);setPage(1);}} />
    <select aria-label="Filter by role" className={selectStyle} value={filter} onChange={event=>{setFilter(event.target.value);setPage(1);}}><option value="all">All roles</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="user">Legacy User</option></select>
    <Button className={actionStyle+' ml-auto'} variant="outline" disabled={loading} onClick={()=>setRefresh(value=>value+1)}><RefreshCw aria-hidden="true" className="h-3 w-3" />Refresh</Button>
   </>}
   {userId&&<Button className={actionStyle+' ml-auto'} variant="outline" asChild><Link href="/admin/users">All Users</Link></Button>}
  </AdminWorkspaceHeader>
  {error&&<p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
  {message&&<p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">{message}</p>}
  {userId?(loading?<p role="status" className="p-3 text-xs text-muted-foreground">Loading User...</p>:record&&<>
   <div className="min-h-0 flex-1 overflow-auto">
    <div className="grid items-start gap-3 md:grid-cols-2">
     <section className="admin-editor-panel space-y-3 rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ModuleIcon moduleKey="users" />User account</h2>
      <dl className="space-y-3"><div><dt className="text-muted-foreground">Name</dt><dd className="mt-1 font-medium">{record.name||'Unnamed User'}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-all">{record.email}</dd></div><div><dt className="mb-1 text-muted-foreground">Account</dt><dd><Badge variant="outline" className="text-[10px]">{record.isActive===true?'Active':'Inactive'}</Badge></dd></div></dl>
     </section>
     <section className="admin-editor-panel space-y-3 rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-violet-500" />Role and access<ModelFieldHelp label="Role and access">An active Super Admin can manage global settings and User roles. The last active Super Admin cannot be demoted. Account activity is read-only here.</ModelFieldHelp></h2>
      <label className="flex flex-col gap-1.5">Role<select className={selectStyle+' w-full'} value={role} disabled={saving} onChange={event=>setRole(event.target.value)}>
       {role!=='admin'&&role!=='super_admin'&&<option value={role} disabled>{roleLabel(role)}</option>}
       <option value="admin">Admin</option><option value="super_admin">Super Admin</option>
      </select></label>
     </section>
    </div>
   </div>
   <div className="admin-editor-actions mt-auto rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2">
    <Button className={actionStyle} disabled={saving||!dirty||!['admin','super_admin'].includes(role)} onClick={()=>void save()}>{saving?'Saving...':'Save Changes'}</Button>
    <Button className={actionStyle} variant="outline" disabled={saving||!dirty} onClick={()=>{setRole(record.role??'');setError('');}}>Discard</Button>
    <Button className={actionStyle} variant="outline" disabled={saving} onClick={()=>{if(!dirty||window.confirm('Discard your draft and reload this User?'))setRefresh(value=>value+1);}}>Reload</Button>
    <span className="text-xs text-muted-foreground">{dirty?'Unsaved changes':'No pending changes'}</span>
   </div>
  </>):<>
   <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border/60" aria-busy={loading}>
    <Table className="text-xs"><TableHeader className="bg-muted/20"><TableRow>{['Name','Email','Role','Account','Actions'].map(title=><TableHead key={title} className="h-8 px-3 text-xs last:text-right">{title}</TableHead>)}</TableRow></TableHeader>
     <TableBody>{records.map(user=><TableRow key={user.id}>
      <TableCell className="px-3 py-2"><Link className="inline-flex items-center gap-2 font-medium hover:underline" href={'/admin/users/'+encodeURIComponent(user.id)}><ModuleIcon moduleKey="users" className="h-3.5 w-3.5 shrink-0" />{user.name||'Unnamed User'}</Link></TableCell>
      <TableCell className="px-3 py-2 text-muted-foreground">{user.email}</TableCell>
      <TableCell className="px-3 py-2"><Badge variant="outline" className={'text-[10px] '+(user.role==='super_admin'?'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300':'')}>{roleLabel(user.role)}</Badge></TableCell>
      <TableCell className="px-3 py-2"><Badge variant="outline" className={'text-[10px] '+(user.isActive===true?'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300':'text-muted-foreground')}>{user.isActive===true?'Active':'Inactive'}</Badge></TableCell>
      <TableCell className="px-3 py-2 text-right"><Button asChild variant="ghost" className={actionStyle}><Link aria-label={'Edit role for '+(user.name||user.email)} href={'/admin/users/'+encodeURIComponent(user.id)}><Pencil aria-hidden="true" className="h-3 w-3" />Edit role</Link></Button></TableCell>
     </TableRow>)}</TableBody>
    </Table>
    {loading&&<p role="status" className="p-4 text-center text-xs text-muted-foreground">Loading Users...</p>}
    {!loading&&!records.length&&!error&&<p className="p-6 text-center text-xs text-muted-foreground">No Users found.</p>}
   </div>
   <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
    <span>{total} Users</span><div className="flex items-center gap-2"><Button className={actionStyle} variant="outline" disabled={loading||page<=1} onClick={()=>setPage(value=>value-1)}>Previous</Button><span>Page {page}</span><Button className={actionStyle} variant="outline" disabled={loading||page*25>=total} onClick={()=>setPage(value=>value+1)}>Next</Button></div>
   </footer>
  </>}
 </div>;
}
