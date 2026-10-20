'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';

type ProjectTitle = { pathname: string; name: string; id: string } | null;
const ProjectTitleContext = createContext<Dispatch<SetStateAction<ProjectTitle>> | null>(null);

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

export function getAppPageTitle(pathname: string | null): string {
  const segments = (pathname ?? '/').split('/').filter(Boolean);
  const titles = segments
    // ThreeD is a grouping route within these surfaces, not another page title.
    .filter((segment, index) => !(segment === 'threed' && index === 1 &&
      (segments[0] === 'admin' || segments[0] === 'dashboard') && segments.length > 2))
    .map((segment) => {
      if (/^\d+$/.test(segment)) return `#${segment}`;
      return labels[segment] ?? segment.replace(/^_/, '').split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });
  return ['ThreeD Garden', ...titles].join(' - ');
}

/** One title owner for server rendering and client-side route transitions. */
export default function AppPageTitle({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectTitle>(null);
  const suffix = project?.pathname === pathname ? ` - ${project.name} [${project.id}]` : '';
  return <ProjectTitleContext.Provider value={setProject}>
    <title>{getAppPageTitle(pathname) + suffix}</title>
    {children}
  </ProjectTitleContext.Provider>;
}
