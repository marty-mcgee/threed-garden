import MainNav from './main-nav'
import UserButton from './user-button'

export default function Header() {
  return (
    <>
      <div
        className='
          flex
          items-center
          justify-between
        '
      >
          <MainNav />
          <UserButton />
      </div>
    </>
  )
}
