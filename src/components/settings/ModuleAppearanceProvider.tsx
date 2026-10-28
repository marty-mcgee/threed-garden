'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { defaultModuleAppearance, moduleAppearanceSnapshotSchema, moduleColors, type ModuleAppearanceSnapshot, type ModuleKey } from '@/libraries/config/module-appearance';
import { moduleIcons } from './module-icons';

const defaults = defaultModuleAppearance();
type State = {snapshot:ModuleAppearanceSnapshot;canEdit:boolean;owner:string|null};
const Context = createContext<{
  snapshot:ModuleAppearanceSnapshot; loaded:boolean; canEdit:boolean; busy:boolean; error:string|null;
  reload:()=>Promise<void>; save:(value:ModuleAppearanceSnapshot)=>Promise<void>;
} | null>(null);

export function ModuleAppearanceProvider({children}:{children:ReactNode}) {
  const {data:session,status} = useSession();
  const owner = session?.user?.id ?? null;
  const identity = useRef(owner); identity.current = owner;
  const sequence = useRef(0);
  const pending = useRef(false);
  const [state,setState] = useState<State|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const reload = async () => {
    if (pending.current) return;
    const ticket = ++sequence.current;
    setBusy(true);
    try {
      const response = await fetch('/api/settings/module-appearance',{cache:'no-store'});
      if (!response.ok) throw new Error('Module appearance could not be loaded.');
      const body = await response.json();
      const snapshot = moduleAppearanceSnapshotSchema.parse(body.snapshot);
      if (ticket !== sequence.current || identity.current !== owner) return;
      setState({snapshot,canEdit:body.canEdit === true,owner}); setError(null);
    } catch { if(ticket===sequence.current) setError('Module appearance could not be loaded. Reload to retry.'); }
    finally { if(ticket===sequence.current) setBusy(false); }
  };
  useEffect(()=>{
    setState(null); setError(null); pending.current=false;
    if(status !== 'loading') void reload();
    return ()=>{sequence.current++;};
    // Account changes invalidate permissions and outstanding responses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[owner,status]);
  const save = async (value:ModuleAppearanceSnapshot) => {
    if(!state || state.owner!==owner || !state.canEdit || busy || pending.current) throw new Error('Settings are not ready to save.');
    pending.current=true; setBusy(true);
    const ticket=++sequence.current;
    try {
      const response=await fetch('/api/settings/module-appearance',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(moduleAppearanceSnapshotSchema.parse(value))});
      if(!response.ok) throw new Error(response.status===409?'Settings changed elsewhere. Reload before saving again.':response.status===403?'An active Super Admin account is required.':'Module appearance could not be saved. Your draft is retained.');
      const snapshot=moduleAppearanceSnapshotSchema.parse(await response.json());
      if(ticket!==sequence.current || identity.current!==owner) throw new Error('Your session changed. Reload Settings.');
      setState({snapshot,canEdit:true,owner}); setError(null);
    } finally {if(ticket===sequence.current){pending.current=false;setBusy(false);}}
  };
  const current=state?.owner===owner?state:null;
  return <Context.Provider value={{snapshot:current?.snapshot??defaults,loaded:!!current,canEdit:current?.canEdit??false,busy,error,reload,save}}>{children}</Context.Provider>;
}

export function useModuleAppearance() { return useContext(Context); }

export function ModuleIcon({moduleKey,className='h-4 w-4',inheritColor=false}:{moduleKey:ModuleKey;className?:string;inheritColor?:boolean}) {
  const context=useModuleAppearance();
  const style=(context?.snapshot??defaults).styles[moduleKey];
  const Icon=moduleIcons[style.icon];
  return <Icon aria-hidden="true" className={`${className} ${inheritColor ? 'text-inherit' : moduleColors[style.color]}`} />;
}
