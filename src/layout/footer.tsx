import CustomLink from './ui/custom-link'
// import MainNav from './main-nav'

export default function Footer() {
  // const appVersion: string = 'v0.16.1'
  const appVersion: string = require('package.json').version
  return (
    <footer 
      id='ThreeDAppFooter'
      // removed className='w-full'
      className='flex flex-row space-x-2 text-xs mr-2 items-center'
      style={{position: 'absolute', bottom: '8px', left: '6px', }}
    >
      {/* <CustomLink href='https://github.com/marty-mcgee/threed-garden/#readme' style={{color: 'gray'}}>
        Documentation
      </CustomLink>
      <CustomLink href='https://github.com/marty-mcgee/threed-garden' style={{color: 'gray'}}>
        Source Code
      </CustomLink>
      <CustomLink href='https://www.npmjs.com/package/threed-garden' style={{color: 'gray'}}>
        JS Packages
      </CustomLink> */}
      <CustomLink href='https://github.com/marty-mcgee/threed-garden' style={{color: '#222222'}}>
        v{appVersion}
      </CustomLink>
      {/* <CustomLink href='/policy' style={{color: 'gray'}}>
        Policies
      </CustomLink>
      <CustomLink href='/' style={{color: 'gray'}}>
        App Root
      </CustomLink>
      <CustomLink href='/home' style={{color: 'gray'}}>
        Home Page
      </CustomLink> */}

      {/* <MainNav /> */}
    
    </footer>
  )
}
