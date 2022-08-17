import { ReactNode } from "react"

// ThreeD Garden components
import MDTypography from "~/components/MDTypography"

function DefaultCell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <MDTypography variant="button" fontWeight="regular" color="text">
      {children}
    </MDTypography>
  )
}

export default DefaultCell
