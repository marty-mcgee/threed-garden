import { useEffect, ReactNode } from 'react'

// nextjs components
// import { useLocation } from "react-router-dom"
import { useRouter } from 'next/navigation'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden context
import { useMaterialUIController, setLayout } from '#/lib/contexts'

// Declaring props types for PageLayout
interface Props {
  background?: 'white' | 'light' | 'default'
  children: ReactNode
}

function PageLayout({ background, children }: Props): JSX.Element {
  const [, dispatch] = useMaterialUIController()
  // const { pathname } = useLocation()
  const { pathname } = useRouter()

  useEffect(() => {
    setLayout(dispatch, 'page')
  }, [pathname])

  return (
    <MDBox
      width='100vw'
      height='100%'
      minHeight='100vh'
      bgColor={background}
      sx={{ overflowX: 'hidden' }}
    >
      {children}
    </MDBox>
  )
}

// Declaring default props for PageLayout
PageLayout.defaultProps = {
  background: 'default',
}

export default PageLayout
