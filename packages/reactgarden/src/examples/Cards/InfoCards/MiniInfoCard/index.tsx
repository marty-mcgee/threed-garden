import { ReactNode } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

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
  title: ReactNode
  description: string
  [key: string]: any
}

function MiniInfoCard({ color, icon, title, description }: Props): JSX.Element {
  return (
    <Card>
      <MDBox p={3}>
        <MDBox
          display="grid"
          justifyContent="center"
          alignItems="center"
          bgColor={color}
          color="white"
          width="3rem"
          height="3rem"
          shadow="md"
          borderRadius="lg"
          variant="gradient">
          <Icon>{icon}</Icon>
        </MDBox>
        <MDBox mt={2.625}>
          <MDTypography
            variant="h5"
            fontWeight="medium"
            textTransform="capitalize">
            {title}
          </MDTypography>
          <MDTypography variant="body2" color="text" fontWeight="regular">
            {description}
          </MDTypography>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for MiniInfoCard
MiniInfoCard.defaultProps = {
  color: "info",
}

export default MiniInfoCard
