import CustomLink from "./custom-link"

export default function Footer() {
  const version = '0.16.0-beta'
  // removed className="w-full"
  return (
    <footer 
      // className="flex flex-col px-4 mx-0 my-2 space-y-1 text-sm md:my-12 md:mx-auto sm:px-4 md:h-5 md:items-center md:space-y-0 md:space-x-2 md:flex-row"
      style={{float: 'right', fontSize: '12px'}}
    >
      &nbsp; &nbsp;
      <CustomLink href="https://github.com/marty-mcgee/threed-garden/#readme">
        docs
      </CustomLink>
      &nbsp; &nbsp;
      <CustomLink href="https://github.com/marty-mcgee/threed-garden">
        source
      </CustomLink>
      &nbsp; &nbsp;
      <CustomLink href="https://www.npmjs.com/package/threed-garden">
        packages
      </CustomLink>
      &nbsp; &nbsp;
      <CustomLink href="https://threedgarden.com/participate">
        version: {version}
      </CustomLink>
      &nbsp; &nbsp;
      <CustomLink href="/policy">
        policies 
      </CustomLink>
      &nbsp; &nbsp;
      <CustomLink href="/">
        |
      </CustomLink>
      &nbsp; &nbsp;
    </footer>
  )
}
