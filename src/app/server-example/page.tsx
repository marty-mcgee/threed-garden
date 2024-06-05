import CustomLink from '#/layout/custom-link'
import SessionData from '#/layout/session-data'
import { auth } from '#/app/auth'

export default async function Page() {
  const session = await auth()
  // console.debug('server-example page: session', session)
  return (
    <div className='space-y-2'>
      <h1 className='text-3xl font-bold'>React Server Component Usage</h1>
      <p>
        This page is server-rendered as a{' '}
        <CustomLink href='https://nextjs.org/docs/app/building-your-application/rendering/server-components'>
          React Server Component
        </CustomLink>
        . It gets the session data on the server using{' '}
        <CustomLink href='https://nextjs.authjs.dev#auth'>
          <code>auth()</code>
        </CustomLink>{' '}
        method.
      </p>
      <SessionData session={session} />
    </div>
  )
}
