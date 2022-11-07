import Link from 'next/link'

const ThreeDLinks = () => {
  const word = "ThreeDLinks"
  return (
    <nav style={{ display: "inline-flex", padding: "0.5rem" }}>
      <div>{word}</div>
      <div>-||-</div>
      <Link href="/">
        Home
      </Link>
      <div>-||-</div>
      <Link href="/about">
        About
      </Link>
      <div>-||-</div>
      <Link href="/pages">
        Pages
      </Link>
      <div>-||-</div>
      <Link href="/pages/page">
        + Page
      </Link>
      <div>-||-</div>
      <Link href="/scenes">
        Scenes
      </Link>
      <div>-||-</div>
      <Link href="/scenes/scene">
        + Scene
      </Link>
      <div>-||-</div>
      <Link href="/events">
        Events
      </Link>
      <div>-||-</div>
      <Link href="/api/hello" passHref>
        {/* eslint-disable jsx-a11y/anchor-is-valid */}
        <a target="_blank" rel="noopener noreferrer">API: Hello</a>
      </Link>
      <div>-||-</div>
      <Link href="/api/preview" passHref>
        {/* eslint-disable jsx-a11y/anchor-is-valid */}
        <a target="_blank" rel="noopener noreferrer">API: Preview</a>
      </Link>
      <div>-||-</div>
    </nav>
  )
}

// export default () => ()
export default ThreeDLinks
