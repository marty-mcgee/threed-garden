import { useRef, useState, useMemo, useEffect } from "react"

// react-chartjs-2 components
import { Line } from "react-chartjs-2"

// @mui material components
import Card from "@mui/material/Card"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// Chart configurations
import configs from "~/pages/applications/calendar/components/ProductivityChart/configs"

// ThreeD Garden Base Styles
import typography from "~/themes/theme-light/base/typography"

function ProductivityChart(): JSX.Element {
  const { size } = typography
  const chartRef = useRef<HTMLDivElement>(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [chart, setChart] = useState([])
  const { data, options }: any = chart

  const handleOpenMenu = ({
    currentTarget,
  }: {
    currentTarget: HTMLSpanElement
  }) => setOpenMenu(currentTarget)
  const handleCloseMenu = () => setOpenMenu(null)

  useEffect(() => setChart(configs()), [])

  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      keepMounted>
      <MenuItem onClick={handleCloseMenu}>Action</MenuItem>
      <MenuItem onClick={handleCloseMenu}>Anoter action</MenuItem>
      <MenuItem onClick={handleCloseMenu}>Something else here</MenuItem>
    </Menu>
  )

  return (
    <Card sx={{ overflow: "hidden" }}>
      <MDBox bgColor="dark" variant="gradient">
        <MDBox p={2}>
          <MDBox display="flex" justifyContent="space-between">
            <MDBox>
              <MDTypography variant="h6" fontWeight="medium" color="white">
                Productivity
              </MDTypography>
              <MDBox display="flex" alignItems="center">
                <MDBox
                  fontSize={size.lg}
                  color="success"
                  mb={0.3}
                  mr={0.5}
                  lineHeight={0}>
                  <Icon sx={{ fontWeight: "bold" }}>arrow_upward</Icon>
                </MDBox>
                <MDTypography
                  variant="button"
                  color="white"
                  fontWeight="medium">
                  4% more{" "}
                  <MDTypography variant="button" color="white">
                    in 2022
                  </MDTypography>
                </MDTypography>
              </MDBox>
            </MDBox>
            <MDTypography color="white" onClick={handleOpenMenu}>
              <Icon sx={{ cursor: "pointer" }}>more_horiz</Icon>
            </MDTypography>
            {renderMenu()}
          </MDBox>
        </MDBox>
        {useMemo(
          () => (
            <MDBox ref={chartRef} sx={{ height: "6.25rem" }}>
              <Line data={data} options={options} />
            </MDBox>
          ),
          [chart]
        )}
      </MDBox>
    </Card>
  )
}

export default ProductivityChart
