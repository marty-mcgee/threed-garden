// @mui material components
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDButton from "components/MDButton"

// Declaring props types for StatusCell
interface Props {
  icon: string
  color:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "dark"
    | "light"
    | "white"
    | "default"
  status: string
}

function StatusCell({ icon, color, status }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center">
      <MDBox mr={1}>
        <MDButton variant="outlined" color={color} size="small" iconOnly circular>
          <Icon sx={{ fontWeight: "bold" }}>{icon}</Icon>
        </MDButton>
      </MDBox>
      <MDTypography variant="caption" fontWeight="medium" color="text" sx={{ lineHeight: 0 }}>
        {status}
      </MDTypography>
    </MDBox>
  )
}

export default StatusCell
