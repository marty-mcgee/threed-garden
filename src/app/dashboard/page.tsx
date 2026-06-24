// import { redirect } from 'next/navigation';

// export default function HomePage() {
//   redirect('/dashboard/music');
// }

// app/dashboard/page.tsx
import { getSettings } from '@/lib/config/settings';
import { buildNavigation } from '@/lib/config/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const settings = getSettings();
  const sections = buildNavigation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Module Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['traffic', 'threed', 'music'] as const).map((module) => {
          const enabled = settings.modules[module].enabled;
          const section = sections.find(s => s.module === module);
          const itemCount = section?.items.length || 0;

          return (
            <Card key={module} className={enabled ? 'border-green-500' : 'border-gray-300 opacity-50'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{module}</span>
                  <span className={`text-sm px-2 py-1 rounded ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {enabled ? 'Active' : 'Disabled'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {enabled ? `${itemCount} pages available` : 'Module is disabled'}
                </p>
                {enabled && itemCount > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {section?.items.slice(0, 4).map((item) => (
                      <span key={item.path} className="text-xs px-2 py-1 bg-accent rounded">
                        {item.name}
                      </span>
                    ))}
                    {itemCount > 4 && (
                      <span className="text-xs px-2 py-1 bg-accent rounded">
                        +{itemCount - 4} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}