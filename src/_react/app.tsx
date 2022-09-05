import { useState, FunctionComponent, ReactNode, ReactElement } from 'react'
// ** logos
import threedgardenLogo from '/images/logo-ThreeD-Garden-Circle-Carrot.png'
import typescriptLogo from '/images/logo-typescript.svg'
import viteLogo from '/images/logo-vite.svg'
import reactLogo from '/images/logo-react.svg'
// ** css
import './style.css'

const App = () => {

  const [likes, setLikes] = useState(0)

  return (
    <div className='App'>
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <a href='https://threedgarden.com/demo' target='_blank'>
          <img src={threedgardenLogo} alt='ThreeD Garden logo' width='200' height='200' />
        </a>
        <h1>ThreeD Garden</h1>
        <div>FarmBot + ThreeJS using React Three Fiber, MUI, NextJS, and TypeScript</div>
      </div>
      <hr />
      <a href='https://vitejs.dev' target='_blank'>
        <img src={viteLogo} className='logo' alt='Vite logo' />
      </a>
      <a href='https://www.typescriptlang.org/' target='_blank'>
        <img src={typescriptLogo} className='logo vanilla' alt='TypeScript logo' />
      </a>
      <a href='https://reactjs.org' target='_blank'>
        <img src={reactLogo} className='logo react' alt='React logo' />
      </a>
      <h2>Vite + TypeScript + React</h2>
      <div className='card'>
        <button onClick={() => setLikes((likes) => likes + 1)}>
          likes: {likes}
        </button>
      </div>
      <p className='read-the-docs'>
        {/* Click on the Vite, TypeScript, and React logos to learn more. */}
      </p>
    </div>
  )
}

export default App
