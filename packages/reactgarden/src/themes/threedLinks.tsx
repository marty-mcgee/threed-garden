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
        <div>
          Home
        </div>
      </Link>
      <div>|</div>
      <Link href="/">
        <div>
          Link 2
        </div>
      </Link>
      <div>|</div>
      <Link href="/">
        <div>
          Link 3
        </div>
      </Link>
      <div>|</div>
      <Link href="/">
        <div>
          Link 4
        </div>
      </Link>
      <div>|</div>
    </nav>
  )
}

// export default () => ()
export default ThreeDLinks
