import { ReactNode } from "react"

// Company Juice Dashboard components
import MDTypography from "components/MDTypography"

function DefaultCell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <MDTypography variant="button" fontWeight="regular" color="text">
      {children}
    </MDTypography>
  )
}

export default DefaultCell
