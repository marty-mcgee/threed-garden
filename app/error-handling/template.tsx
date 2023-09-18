import { Boundary } from '#/ui/playground/Boundary';

export default function Page({ children }: { children: React.ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
