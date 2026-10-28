'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Users, Pencil, RefreshCw, ShieldCheck, Plus, Trash2 } from 'lucide-react';
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
export function UsersWorkspace({userId,createNew=false}:{userId?:string;createNew?:boolean}) {
 const editing=!!userId||createNew;
 const {data:session,status}=useSession();
 const owner=session?.user?.id;
 const [storedRecords,setRecords]=useState<AdminUserRecord[]>([]);
 const [storedRecord,setRecord]=useState<AdminUserRecord|null>(null);
 const [loadedKey,setLoadedKey]=useState('');
 const viewKey=String(owner)+':'+(createNew?'new':userId??'list');
 const record=loadedKey===viewKey?storedRecord:null;
 const records=loadedKey===viewKey?storedRecords:[];
 const [role,setRole]=useState('');
 const [name,setName]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [deleteOpen,setDeleteOpen]=useState(false);
 const [confirmEmail,setConfirmEmail]=useState('');
 const [accountFilter,setAccountFilter]=useState('current');
 const mutation=useRef(false);
 const leaving=useRef(false);
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
 const dirty=createNew?!!(name||email||password):!!record&&!record.isDeleted&&(role!==(record.role??'')||name!==(record.name??'')||email!==record.email);
 useEffect(()=>{
  const generation=++sequence.current;
  const controller=new AbortController();
  setLoadedKey('');setRecord(null);setRecords([]);setLoading(true);setError('');setMessage('');setSaving(false);setName('');setEmail('');setPassword('');setDeleteOpen(false);setConfirmEmail('');
  if(status==='loading')return ()=>controller.abort();
  if(!owner){setLoading(false);setError('Sign in required.');return ()=>controller.abort();}
  const query=new URLSearchParams({search,role:filter,status:accountFilter,page:String(page)});
  const url=createNew?'/api/admin/users/'+encodeURIComponent(owner):userId?'/api/admin/users/'+encodeURIComponent(userId):'/api/admin/users?'+query;
  const timer=setTimeout(()=>{void fetch(url,{signal:controller.signal,cache:'no-store'}).then(async response=>{
   const value=await response.json();if(!response.ok)throw new Error(value.error||'Users could not be loaded.');
   if(generation!==sequence.current||identity.current!==owner)return;
   setLoadedKey(String(owner)+':'+(createNew?'new':userId??'list'));
   if(createNew){setRole('admin');}else if(userId){setRecord(value);setRole(value.role??'');setName(value.name??'');setEmail(value.email);}else{setRecords(value.data);setTotal(value.total);}
  }).catch(reason=>{if(!controller.signal.aborted&&generation===sequence.current)setError(reason.message);})
   .finally(()=>{if(!controller.signal.aborted&&generation===sequence.current)setLoading(false);});},editing?0:200);
  return ()=>{controller.abort();clearTimeout(timer);};
 },[owner,status,userId,createNew,editing,search,filter,accountFilter,page,refresh]);
 useEffect(()=>{
  if(!dirty&&!saving)return;
  const warn=(event:BeforeUnloadEvent)=>{if(!leaving.current){event.preventDefault();event.returnValue='';}};
  const guard=(event:MouseEvent)=>{const link=(event.target as Element).closest?.('a[href]');if(link&&(saving||!window.confirm('Discard unsaved User changes?'))){event.preventDefault();event.stopPropagation();}};
  window.addEventListener('beforeunload',warn);document.addEventListener('click',guard,true);
  return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',guard,true);};
 },[dirty,saving]);
 async function save(){
  if(leaving.current||mutation.current||saving||!dirty||(!record&&!createNew)||record?.isDeleted)return;
  mutation.current=true;
  const generation=sequence.current;const currentOwner=owner;
  setSaving(true);setError('');setMessage('');
  try{
   const response=await fetch(createNew?'/api/admin/users':'/api/admin/users/'+encodeURIComponent(record!.id),{method:createNew?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(createNew?{name,email,password}:{name,email,role,revision:record!.revision})});
   const value=await response.json();if(!response.ok)throw new Error(value.error||'User could not be saved.');
   if(generation!==sequence.current||identity.current!==currentOwner)return;
   setPassword('');
   if(createNew){leaving.current=true;window.location.assign('/admin/users/'+encodeURIComponent(value.id));return;}
   setRecord(value);setRole(value.role);setName(value.name??'');setEmail(value.email);setMessage('User saved.');
   if(value.id===currentOwner&&value.role!=='super_admin'){leaving.current=true;window.location.assign('/admin');}
  }catch(reason){if(generation===sequence.current&&identity.current===currentOwner)setError(reason instanceof Error?reason.message:'User could not be saved.');}
  finally{mutation.current=false;if(generation===sequence.current&&identity.current===currentOwner)setSaving(false);}
 }
 async function remove(){
  if(!record||record.isDeleted||mutation.current||dirty||record.id===owner||confirmEmail!==record.email)return;
  mutation.current=true;setSaving(true);setError('');setMessage('');
  const generation=sequence.current,currentOwner=owner;
  try{
   const response=await fetch('/api/admin/users/'+encodeURIComponent(record.id),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:record.revision,confirmEmail})});
   const value=await response.json();if(!response.ok)throw new Error(value.error||'User could not be deleted.');
   if(generation!==sequence.current||identity.current!==currentOwner)return;
   setRecord(value);setDeleteOpen(false);setConfirmEmail('');setMessage('User soft-deleted. Account access is blocked; records are retained.');
  }catch(reason){if(generation===sequence.current&&identity.current===currentOwner)setError(reason instanceof Error?reason.message:'User could not be deleted.');}
  finally{mutation.current=false;if(generation===sequence.current&&identity.current===currentOwner)setSaving(false);}
 }
 return <div className="flex h-full min-h-0 flex-col gap-2">
  <AdminWorkspaceHeader moduleKey="users" icon={Users} title={createNew?'New User':userId?'Edit User':'Users'} description="Create and manage User accounts." className="shrink-0">
   <ModelFieldHelp label="Users">Super Admins manage User roles and global Module styling. Admins manage their own content.</ModelFieldHelp>
   {!editing&&<>
    <Badge variant="outline" className="text-[10px]">{loading?'...':total}</Badge>
    <Input aria-label="Search Users" className="h-7 w-full text-xs sm:w-60" placeholder="Search name or email..." value={search} maxLength={100} onChange={event=>{setSearch(event.target.value);setPage(1);}} />
    <select aria-label="Filter by role" className={selectStyle} value={filter} onChange={event=>{setFilter(event.target.value);setPage(1);}}><option value="all">All roles</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="user">Legacy User</option></select>
    <select aria-label="Filter by account" className={selectStyle} value={accountFilter} onChange={event=>{setAccountFilter(event.target.value);setPage(1);}}><option value="current">Current Users</option><option value="deleted">Deleted Users</option><option value="all">All Users</option></select>
    {!loading&&!error&&<Button asChild className={actionStyle} variant="success"><Link href="/admin/users/new"><Plus aria-hidden="true" className="h-3 w-3" />Add User</Link></Button>}
    <Button className={actionStyle+' ml-auto'} variant="outline" disabled={loading} onClick={()=>setRefresh(value=>value+1)}><RefreshCw aria-hidden="true" className="h-3 w-3" />Refresh</Button>
   </>}
   {editing&&<Button className={actionStyle+' ml-auto'} variant="outline" asChild><Link href="/admin/users">All Users</Link></Button>}
  </AdminWorkspaceHeader>
  {error&&<p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
  {message&&<p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">{message}</p>}
  {editing?(loading?<p role="status" className="p-3 text-xs text-muted-foreground">Loading User...</p>:(record||createNew&&loadedKey===viewKey)&&<>
   <div className="min-h-0 flex-1 overflow-auto">
    <div className="grid items-start gap-3 md:grid-cols-2">
     <section className="admin-editor-panel space-y-3 rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ModuleIcon moduleKey="users" />User account</h2>
      <label className="flex flex-col gap-1.5">Name<Input aria-label="User name" className="h-8 text-xs" value={name} maxLength={100} disabled={saving||record?.isDeleted} onChange={event=>setName(event.target.value)} /></label>
      <label className="flex flex-col gap-1.5">Email<Input aria-label="User email" type="email" className="h-8 text-xs" value={email} maxLength={254} disabled={saving||record?.isDeleted} onChange={event=>setEmail(event.target.value)} /></label>
      {createNew?<label className="flex flex-col gap-1.5">Initial password<Input aria-label="Initial password" type="password" autoComplete="new-password" className="h-8 text-xs" value={password} disabled={saving} onChange={event=>setPassword(event.target.value)} /><span className="text-muted-foreground">At least 8 characters, at most 72 UTF-8 bytes. Share securely with the User. No invitation email is sent.</span></label>:<Badge variant="outline" className="text-[10px]">{record?.isDeleted?'Deleted':record?.isActive===true?'Active':'Inactive'}</Badge>}

     </section>
     <section className="admin-editor-panel space-y-3 rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-violet-500" />Role and access<ModelFieldHelp label="Role and access">An active Super Admin can manage global settings and User roles. The last active Super Admin cannot be demoted. Deleted accounts cannot sign in. Account activity is read-only here.</ModelFieldHelp></h2>
      {createNew?<p>New Users are created as Admins of their own content. Save first to edit their role.</p>:<label className="flex flex-col gap-1.5">Role<select className={selectStyle+' w-full'} value={role} disabled={saving||record?.isDeleted} onChange={event=>setRole(event.target.value)}>
       {role!=='admin'&&role!=='super_admin'&&<option value={role} disabled>{roleLabel(role)}</option>}
       <option value="admin">Admin</option><option value="super_admin">Super Admin</option>
      </select></label>}
     </section>
    </div>
    {record&&!record.isDeleted&&<section className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs">
     <h2 className="font-semibold">Delete User</h2><p className="my-2 text-muted-foreground">Soft deletion blocks account access and retains all records. Users who own content cannot be deleted.</p>
     <Button variant="outline" className={actionStyle} disabled={saving||dirty||record.id===owner} onClick={()=>setDeleteOpen(value=>!value)}><Trash2 aria-hidden="true" className="h-3 w-3" />Delete User</Button>
     {record.id===owner&&<p className="mt-2 text-muted-foreground">You cannot delete your own account.</p>}
     {deleteOpen&&<div className="mt-3 space-y-2"><label className="flex flex-col gap-1.5">Type {record.email} to confirm<Input aria-label="Confirm User email" value={confirmEmail} disabled={saving} onChange={event=>setConfirmEmail(event.target.value)} /></label><Button variant="destructive" className={actionStyle} disabled={saving||confirmEmail!==record.email} onClick={()=>void remove()}>Confirm Delete User</Button><Button variant="outline" className={actionStyle} disabled={saving} onClick={()=>{setDeleteOpen(false);setConfirmEmail('');}}>Cancel deletion</Button></div>}
    </section>}
   </div>
   <div className="admin-editor-actions mt-auto rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2">
    <Button variant={!createNew ? "default" : "success"} className={actionStyle} disabled={saving||!dirty||!name.trim()||!email.trim()||!!record?.isDeleted||createNew&&password.length<8} onClick={()=>void save()}>{saving?'Saving...':createNew?'Create User':'Save Changes'}</Button>
    <Button className={actionStyle} variant="outline" disabled={saving||!dirty} onClick={()=>{setRole(record?.role??'admin');setName(record?.name??'');setEmail(record?.email??'');setPassword('');setError('');}}>Discard</Button>
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
      <TableCell className="px-3 py-2"><Badge variant="outline" className={'text-[10px] '+(user.isActive===true?'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300':'text-muted-foreground')}>{user.isDeleted?'Deleted':user.isActive===true?'Active':'Inactive'}</Badge></TableCell>
      <TableCell className="px-3 py-2 text-right"><Button asChild variant="ghost" className={actionStyle}><Link aria-label={'Edit User '+(user.name||user.email)} href={'/admin/users/'+encodeURIComponent(user.id)}><Pencil aria-hidden="true" className="h-3 w-3" />{user.isDeleted?'View':'Edit'}</Link></Button></TableCell>
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
