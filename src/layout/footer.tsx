import CustomLink from './ui/custom-link'
// import MainNav from './main-nav'

export default function Footer() {
  // const appVersion: string = 'v0.16.1'
  const appVersion: string = require('package.json').version
  const linkColor: string = '#333333' // gray | darkgray | # 222222 | # EEEEEE

  return (
    <div 
      id='ThreeDAppFooter'
      // [MM] removed: className: w-full
      className='flex flex-row space-x-2 text-xs mr-2 items-center'
      // style={{position: 'absolute', bottom: '8px', left: '6px', }}
    >
      <CustomLink href='https://github.com/marty-mcgee/threed-garden/tree/threed-app-ts' style={{color: linkColor}}>
        v{appVersion}
      </CustomLink>
      <CustomLink href='https://github.com/marty-mcgee/threed-garden' style={{color: linkColor}}>
        Source
      </CustomLink>
      <CustomLink href='https://www.npmjs.com/package/threed-garden' style={{color: linkColor}}>
        Packages
      </CustomLink>
      {/* 
      <CustomLink href='https://github.com/marty-mcgee/threed-garden/#readme' style={{color: linkColor}}>
        Documentation
      </CustomLink> 
      */}
      {/* 
      <CustomLink href='/policy' style={{color: linkColor}}>
        Policies
      </CustomLink>
      <CustomLink href='/' style={{color: linkColor}}>
        App Root
      </CustomLink>
      <CustomLink href='/home' style={{color: linkColor}}>
        Home Page
      </CustomLink> 
      */}

      {/* <MainNav /> */}
    
    </div>
  )
}
