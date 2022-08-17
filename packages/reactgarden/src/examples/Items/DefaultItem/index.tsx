import { forwardRef, FC, ReactNode } from "react"

// @mui material components
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// custom styles for the DefaultItem
import defaultItemIconBox from "~/examples/Items/DefaultItem/styles"

// Declaring props types for DefaultItem
interface Props {
  color?:
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark"
  icon: ReactNode
  title: string
  description: string
  [key: string]: any
}

const DefaultItem: FC<Props> = forwardRef(
  ({ color, icon, title, description, ...rest }, ref) => (
    <MDBox {...rest} ref={ref} display="flex" alignItems="center">
      <MDBox sx={(theme) => defaultItemIconBox(theme, { color })}>
        <Icon>{icon}</Icon>
      </MDBox>
      <MDBox ml={2} mt={0.5} lineHeight={1.4}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {title}
        </MDTypography>
        <MDTypography variant="button" fontWeight="regular" color="text">
          {description}
        </MDTypography>
      </MDBox>
    </MDBox>
  )
)

// Declaring default props for DefaultItem
DefaultItem.defaultProps = {
  color: "info",
}

export default DefaultItem
