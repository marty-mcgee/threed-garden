import ReactDOM from "react-dom"
import { BrowserRouter } from "react-router-dom"
import App from "App"

// Material UI Context Provider
import { MaterialUIControllerProvider } from "context"

ReactDOM.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>,
  document.getElementById("root")
)
