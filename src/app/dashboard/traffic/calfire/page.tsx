// src/app/dashboard/calfire/page.tsx
import CalFireContent from './calfireContent';

export const metadata = {
  description: 'Real-time wildfire incidents from CalFire',
};

export default function CalFirePage() {
  return <CalFireContent />;
}