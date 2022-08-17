import { ReactNode } from "react"

// @mui material components
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// Timeline context
import { useTimeline } from "~/components/examples/Timeline/context"

// Custom styles for the TimelineItem
import timelineItem from "~/components/examples/Timeline/TimelineItem/styles"

// Declaring prop types for TimelineItem
interface Props {
  color?:
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark"
  | "light"
  icon: ReactNode
  title: string
  dateTime: string
  description?: string
  lastItem?: boolean
  [key: string]: any
}

function TimelineItem({
  color,
  icon,
  title,
  dateTime,
  description,
  lastItem,
}: Props): JSX.Element {
  const isDark = useTimeline()

  return (
    <MDBox
      position="relative"
      mb={3}
      sx={(theme: any) => timelineItem(theme, { lastItem, isDark })}>
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgColor={color}
        color="white"
        width="2rem"
        height="2rem"
        borderRadius="50%"
        position="absolute"
        top="8%"
        left="2px"
        zIndex={2}
        sx={{ fontSize: ({ typography: { size } }: any) => size.sm }}>
        <Icon fontSize="inherit">{icon}</Icon>
      </MDBox>
      <MDBox
        ml={5.75}
        pt={description ? 0.7 : 0.5}
        lineHeight={0}
        maxWidth="30rem">
        <MDTypography
          variant="button"
          fontWeight="medium"
          color={isDark ? "white" : "dark"}>
          {title}
        </MDTypography>
        <MDBox mt={0.5}>
          <MDTypography variant="caption" color={isDark ? "secondary" : "text"}>
            {dateTime}
          </MDTypography>
        </MDBox>
        <MDBox mt={2} mb={1.5}>
          {description ? (
            <MDTypography variant="button" color={isDark ? "white" : "dark"}>
              {description}
            </MDTypography>
          ) : null}
        </MDBox>
      </MDBox>
    </MDBox>
  )
}

// Declaring default props for TimelineItem
TimelineItem.defaultProps = {
  color: "info",
  lastItem: false,
  description: "",
}

export default TimelineItem
