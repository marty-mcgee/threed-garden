import { cn } from "#//lib/utils/tailwind-utils"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface CustomLinkProps extends React.LinkHTMLAttributes<HTMLAnchorElement> {
  href: string
}

const CustomLink = ({
  href,
  children,
  className,
  ...rest
}: CustomLinkProps) => {
  // ** internal link?
  let isInternalLink = false
  isInternalLink = href.startsWith("/")
  // exceptions
  if (href == "/demo/index.html") {
    isInternalLink = false
  }
  // ** anchor link?
  const isAnchorLink = href.startsWith("#")

  if (isInternalLink || isAnchorLink) {
    return (
      <Link 
        href={href} 
        className={className} 
        {...rest}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // className={cn("items-center underline", className)}
      className={className} 
      {...rest}
    >
      {children}
      {/* <ExternalLink 
        className="ml-0.5 h-4 w-4 inline-block" 
      /> */}
    </Link>
  )
}

export default CustomLink
