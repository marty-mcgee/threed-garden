import CustomLink from "./custom-link"

export default function Footer() {
  const version = '0.15.0'
  return (
    <footer className="flex flex-col w-full px-4 mx-0 my-2 space-y-1 text-sm md:my-12 md:mx-auto sm:px-4 md:h-5 md:items-center md:space-y-0 md:space-x-2 md:flex-row">
      <CustomLink href="https://github.com/marty-mcgee/threed-garden/#readme">Documentation</CustomLink>
      <CustomLink href="https://github.com/marty-mcgee/threed-garden/tree/threed-app-ts">
        Source on GitHub
      </CustomLink>
      <CustomLink href="https://www.npmjs.com/package/threed-garden">
        npm
      </CustomLink>
      <CustomLink href="https://threedgarden.com/participate">Version: {version}</CustomLink>
      <CustomLink href="/policy">Site Policy</CustomLink>
    </footer>
  )
}
