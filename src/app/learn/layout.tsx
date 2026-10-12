import DashboardLayout from '@/app/dashboard/layout';

// Dashboard's existing App shell is public: authentication is enforced by actions,
// not this layout. Root Providers already supply theme, session and preferences.
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
