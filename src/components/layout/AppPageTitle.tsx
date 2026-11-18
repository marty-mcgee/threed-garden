'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';

type ProjectTitle = { pathname: string; name: string; id: string } | null;
const ProjectTitleContext = createContext<Dispatch<SetStateAction<ProjectTitle>> | null>(null);
type AssemblyTitle = {
  pathname: string;
  name: string;
} | null;
const AssemblyTitleContext = createContext<Dispatch<SetStateAction<AssemblyTitle>> | null>(null);

export function useAssemblyPageTitle(name: string | undefined) {
  const pathname = usePathname();
  const setAssembly = useContext(AssemblyTitleContext);
  useEffect(() => {
    if (!setAssembly) return;
    setAssembly(name?.trim() ? {
      pathname,
      name: name.trim(),
    } : null);
    return () => setAssembly(null);
  }, [name, pathname, setAssembly]);
}

export function useProjectPageTitle(id: string | null, name: string | undefined) {
  const pathname = usePathname();
  const setProject = useContext(ProjectTitleContext);
  useEffect(() => {
    if (!setProject) return;
    setProject(id && name ? { pathname, id, name } : null);
    return () => setProject(null);
  }, [id, name, pathname, setProject]);
}

const labels: Record<string, string> = {
  threed: 'ThreeD Garden',
  learn: 'Learn ThreeD',
  auth: 'Account',
  logs: 'System Logs',
  farmbots: 'FarmBots',
  calfire: 'CalFire',
  caltrans: 'Caltrans',
  '511org': 'Bay Area 511',
  'chp-live': 'CHP Live',
  'chp-historical': 'CHP Historical',
  'chp-centers': 'CHP Centers',
  'chp-cases': 'CHP Cases',
  'chp-cad': 'CHP CAD',
  'caltrans-cctv': 'Caltrans CCTV',
  'home-design': 'Design',
  chatgpt: 'ChatGPT',
};

export function getAppPageTitle(pathname: string | null, titlePrefix = 'ThreeD Garden', assemblyName?: string): string {
  const segments = (pathname ?? '/').split('/').filter(Boolean);
  const assemblyRecord = /^\/admin\/threed\/assembly-groups\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i.test(pathname ?? '');
  if (assemblyRecord) segments.pop();
  const titles = segments
    // ThreeD is a grouping route within these surfaces, not another page title.
    .filter((segment, index) => !(segment === 'threed' && index === 1 &&
      (segments[0] === 'admin' || segments[0] === 'dashboard') && segments.length > 2))
    .map((segment) => {
      if (/^\d+$/.test(segment)) return `#${segment}`;
      return labels[segment] ?? segment.replace(/^_/, '').split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });
  return [titlePrefix, ...titles, ...(assemblyRecord && assemblyName?.trim() ? [assemblyName.trim()] : [])].join(' - ');
}

/** One title owner for server rendering and client-side route transitions. */
export default function AppPageTitle({ children, titlePrefix = 'ThreeD Garden' }: { children: ReactNode; titlePrefix?: string }) {
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectTitle>(null);
  const [assembly, setAssembly] = useState<AssemblyTitle>(null);
  const suffix = project?.pathname === pathname ? ` - ${project.name} [${project.id}]` : '';
  return <ProjectTitleContext.Provider value={setProject}>
    <AssemblyTitleContext.Provider value={setAssembly}>
      <title>{getAppPageTitle(pathname, titlePrefix, assembly?.pathname === pathname ? assembly.name : undefined) + suffix}</title>
      {children}
    </AssemblyTitleContext.Provider>
  </ProjectTitleContext.Provider>;
}
