import CustomLink from './custom-link'

export default function Footer() {
  const version = '0.16.0-beta'
  // removed className='w-full'
  return (
    <footer 
      className='flex flex-row space-x-2 text-xs mr-2 items-center'
      style={{float: 'right'}}
    >
      <CustomLink href='https://github.com/marty-mcgee/threed-garden/#readme' style={{color: 'gray'}}>
        Documentation
      </CustomLink>
      <CustomLink href='https://github.com/marty-mcgee/threed-garden' style={{color: 'gray'}}>
        Source on GitHub
      </CustomLink>
      <CustomLink href='https://www.npmjs.com/package/threed-garden' style={{color: 'gray'}}>
        JS Packages
      </CustomLink>
      <CustomLink href='https://threedgarden.com/participate' style={{color: 'gray'}}>
        Version: {version}
      </CustomLink>
      <CustomLink href='/' style={{color: 'gray'}}>
        App
      </CustomLink>
      <CustomLink href='/home' style={{color: 'gray'}}>
        Home
      </CustomLink>
      <CustomLink href='/policy' style={{color: 'gray'}}>
        Policies
      </CustomLink>
    </footer>
  )
}
