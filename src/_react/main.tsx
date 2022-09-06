// import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from '~/_react/app'

import '~/styles/index.css'

ReactDOM
  .createRoot(
    document.getElementById('root') as HTMLElement
  )
  .render(
    // <React.StrictMode>
    //   <App />
    // </React.StrictMode>
    <App />
  )
  