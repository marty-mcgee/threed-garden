import { ReactNode } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Company Juice Dashboard context
import { useMaterialUIController } from "context"

// Decalaring props types for MiniStatisticsCard
interface Props {
  bgColor?:
    | "white"
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "dark"
  title?: {
    fontWeight?: "light" | "regular" | "medium" | "bold"
    text?: string
  }
  count: string | number
  percentage?: {
    color:
      | "primary"
      | "secondary"
      | "info"
      | "success"
      | "warning"
      | "error"
      | "dark"
      | "white"
    text: string | number
  }
  icon: {
    color:
      | "primary"
      | "secondary"
      | "info"
      | "success"
      | "warning"
      | "error"
      | "dark"
    component: ReactNode
  }
  direction?: "right" | "left"
  [key: string]: any
}

function MiniStatisticsCard({
  bgColor,
  title,
  count,
  percentage,
  icon,
  direction,
}: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <Card sx={{ overflow: "hidden" }}>
      <MDBox
        bgColor={bgColor}
        variant="gradient"
        sx={({ palette: { background } }: { palette: any }) => ({
          background: darkMode && background.card,
        })}>
        <MDBox p={2}>
          <Grid container alignItems="center">
            {direction === "left" ? (
              <Grid item xs={4}>
                <MDBox
                  variant="gradient"
                  bgColor={bgColor === "white" ? icon.color : "white"}
                  color={bgColor === "white" ? "white" : "dark"}
                  width="4rem"
                  height="4rem"
                  borderRadius="md"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  shadow="md">
                  <Icon fontSize="medium" color="inherit">
                    {icon.component}
                  </Icon>
                </MDBox>
              </Grid>
            ) : null}
            <Grid item xs={8}>
              <MDBox
                ml={direction === "left" ? 2 : 0}
                lineHeight={1}
                textAlign={direction === "left" ? "right" : "left"}>
                <MDTypography
                  variant="button"
                  color={bgColor === "white" ? "text" : "white"}
                  opacity={bgColor === "white" ? 1 : 0.7}
                  textTransform="capitalize"
                  fontWeight={title.fontWeight}>
                  {title.text}
                </MDTypography>
                <MDTypography
                  variant="h5"
                  fontWeight="bold"
                  color={bgColor === "white" ? "dark" : "white"}>
                  {count}{" "}
                  <MDTypography
                    variant="button"
                    color={percentage.color}
                    fontWeight="bold">
                    {percentage.text}
                  </MDTypography>
                </MDTypography>
              </MDBox>
            </Grid>
            {direction === "right" ? (
              <Grid item xs={4}>
                <MDBox
                  variant="gradient"
                  bgColor={bgColor === "white" ? icon.color : "white"}
                  color={bgColor === "white" ? "white" : "dark"}
                  width="4rem"
                  height="4rem"
                  marginLeft="auto"
                  borderRadius="md"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  shadow="md">
                  <Icon fontSize="medium" color="inherit">
                    {icon.component}
                  </Icon>
                </MDBox>
              </Grid>
            ) : null}
          </Grid>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for MiniStatisticsCard
MiniStatisticsCard.defaultProps = {
  bgColor: "white",
  title: {
    fontWeight: "light",
    text: "",
  },
  percentage: {
    color: "success",
    text: "",
  },
  direction: "right",
}

export default MiniStatisticsCard
