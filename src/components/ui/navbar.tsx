"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeSelector } from "@/components/themes/selector";
import { Button } from "@/components/ui/button";
import { 
  auth,
  // useSession, 
  // getSession,
  signOut 
} from "@/lib/auth";

export function NavBar() {
  // const { data: session, isPending } = useSession();

  // const session = auth();
  const session = async () => {
    await auth();
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  const isPending = session?.user?.id ? false : true

  return (
    <nav className="flex items-center justify-between py-2 md:py-2">
      <Link href="/">
        <div className="flex items-center">
          <Image
            className="lg:h-7 lg:w-auto dark:hidden"
            src="/favicon.png"
            alt="App logo"
            width={88}
            height={24}
            priority
          />
          <Image
            className="hidden lg:h-7 lg:w-auto dark:block"
            src="/favicon.png"
            alt="App logo"
            width={88}
            height={24}
            priority
          />
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSelector />
        {isPending ? (
          <Button variant="outline" disabled>
            Loading...
          </Button>
        ) : session?.user ? (
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <Button variant="default" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
