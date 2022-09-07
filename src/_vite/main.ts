// ** custom components
import { setupLikes } from '~/_vite/likes'
// ** logos
import threedgardenLogo from '/media/images/logo-ThreeD-Garden-Circle-Carrot.png'
import typescriptLogo from '/media/images/logo-typescript.svg'
import viteLogo from '/media/images/logo-vite.svg'
// ** css
import '~/_vite/style.css'

// ** return component (tsx)
document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
  <div>
    <div style="text-align: center; margin-bottom: 2rem;">
      <a href="https://threedgarden.com/demo/" target="_blank">
        <img src="${threedgardenLogo}" alt="ThreeD Garden Logo" width="200" height="200" />
      </a>
      <h1>ThreeD Garden</h1>
      <div>FarmBot + ThreeJS using React Three Fiber, MUI, NextJS, and TypeScript</div>
    </div>
    <hr />
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h2>Vite + TypeScript</h2>
    <div class="card">
      <button id="likes" type="button"></button>
    </div>
    <p class="read-the-docs">
      <!-- Click on the Vite and TypeScript logos to learn more. -->
    </p>
  </div>
`
// ** use functions
setupLikes(
  document.querySelector<HTMLButtonElement>('#likes')!
)
