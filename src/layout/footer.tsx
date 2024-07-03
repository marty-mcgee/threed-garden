import CustomLink from './custom-link'

export default function Footer() {
  const version = '0.16.0-beta'
  return (
    <footer 
      id='ThreeDAppFooter'
      // removed className='w-full'
      className='flex flex-row space-x-2 text-xs mr-2 items-center'
      style={{position: 'absolute', bottom: '8px', right: '8px', }}
    >
      <CustomLink href='https://github.com/marty-mcgee/threed-garden/#readme' style={{color: 'gray'}}>
        Documentation
      </CustomLink>
      <CustomLink href='https://github.com/marty-mcgee/threed-garden' style={{color: 'gray'}}>
        Source Code
      </CustomLink>
      <CustomLink href='https://www.npmjs.com/package/threed-garden' style={{color: 'gray'}}>
        JS Packages
      </CustomLink>
      <CustomLink href='/participate' style={{color: 'gray'}}>
        V:{version}
      </CustomLink>
      <CustomLink href='/policy' style={{color: 'gray'}}>
        Policies
      </CustomLink>
      <CustomLink href='/' style={{color: 'gray'}}>
        App Root
      </CustomLink>
      <CustomLink href='/home' style={{color: 'gray'}}>
        Home Page
      </CustomLink>
    </footer>
  )
}
