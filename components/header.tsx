import { MainNav } from "./main-nav"
import UserButton from "./user-button"

export default function Header() {
  return (
    <header className="sticky flex justify-center border-b">
      <div className="flex items-center justify-between w-full h-16 ml-0 mr-1 px-0 mx-auto sm:px-1">
        <MainNav />
        {/* @ ts-expect-error Async Server Component */}
        {/* @ts-ignore */}
        <UserButton />
      </div>
    </header>
  )
}
