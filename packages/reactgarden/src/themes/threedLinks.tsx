// const ThreeDLinks = {} // as Object
// const ThreeDLinks = () => <nav>ThreeDLinks</nav> // as function component FC returning TSX
// export default () => ()
// export default ThreeDLinks // export module

import Link from 'next/link'

const ThreeDLinks = () => {
  const word = "ThreeDLinks"
  return (
    <nav style={{ display: "inline-flex", padding: "0.5rem" }}>
      <div>{word}</div>
      <div>|</div>
      <Link href="/">
        Home
      </Link>
      <div>|</div>
      <Link href="/about">
        About
      </Link>
      <div>|</div>
      <Link href="/pages">
        Pages
      </Link>
      <div>|</div>
      <Link href="/pages/page">
        -- Page
      </Link>
      <div>|</div>
      <Link href="/scenes">
        Scenes
      </Link>
      <div>|</div>
      <Link href="/scenes/scene">
        -- Scene
      </Link>
      <div>|</div>
    </nav>
  )
}

// export default () => ()
export default ThreeDLinks
