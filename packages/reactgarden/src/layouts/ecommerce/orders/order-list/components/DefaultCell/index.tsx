// Company Juice Dashboard components
import MDTypography from "components/MDTypography"

// Declaring props types for DefaultCell
interface Props {
  value: string
  suffix?: string | boolean
}

function DefaultCell({ value, suffix }: Props): JSX.Element {
  return (
    <MDTypography variant="caption" fontWeight="medium" color="text">
      {value}
      {suffix && (
        <MDTypography variant="caption" fontWeight="medium" color="secondary">
          &nbsp;&nbsp;{suffix}
        </MDTypography>
      )}
    </MDTypography>
  )
}

// Declaring default props for DefaultCell
DefaultCell.defaultProps = {
  suffix: "",
}

export default DefaultCell
