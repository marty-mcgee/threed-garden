import { useEffect, ReactNode } from "react"

// react-router-dom components
import { useLocation } from "react-router-dom"

// Company Juice Dashboard components
import MDBox from "components/MDBox"

// Company Juice Dashboard context
import { useMaterialUIController, setLayout } from "context"

// Declaring props types for PageLayout
interface Props {
  background?: "white" | "light" | "default"
  children: ReactNode
}

function PageLayout({ background, children }: Props): JSX.Element {
  const [, dispatch] = useMaterialUIController()
  const { pathname } = useLocation()

  useEffect(() => {
    setLayout(dispatch, "page")
  }, [pathname])

  return (
    <MDBox
      width="100vw"
      height="100%"
      minHeight="100vh"
      bgColor={background}
      sx={{ overflowX: "hidden" }}
    >
      {children}
    </MDBox>
  )
}

// Declaring default props for PageLayout
PageLayout.defaultProps = {
  background: "default",
}

export default PageLayout
