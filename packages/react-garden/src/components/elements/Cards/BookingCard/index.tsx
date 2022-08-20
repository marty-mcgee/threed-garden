import { ReactNode } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Divider from "@mui/material/Divider"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// Declaring props types for BookingCard
interface Props {
  image: string
  title: string
  description: string
  price: string
  location: ReactNode
  action?: ReactNode | boolean
  [key: string]: any
}

function BookingCard({
  image,
  title,
  description,
  price,
  location,
  action,
}: Props): JSX.Element {
  return (
    <Card
      sx={{
        "&:hover .card-header": {
          transform: action && "translate3d(0, -50px, 0)",
        },
      }}>
      <MDBox
        position="relative"
        borderRadius="lg"
        mt={-3}
        mx={2}
        className="card-header"
        sx={{ transition: "transform 300ms cubic-bezier(0.34, 1.61, 0.7, 1)" }}>
        <MDBox
          component="img"
          src={image}
          alt={title}
          borderRadius="lg"
          shadow="md"
          width="100%"
          height="100%"
          position="relative"
          zIndex={1}
        />
        <MDBox
          borderRadius="lg"
          shadow="md"
          width="100%"
          height="100%"
          position="absolute"
          left={0}
          top="0"
          sx={{
            backgroundImage: `url(${image})`,
            transform: "scale(0.94)",
            filter: "blur(12px)",
            backgroundSize: "cover",
          }}
        />
      </MDBox>
      <MDBox textAlign="center" pt={3} px={3}>
        <MDBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          mt={action ? -8 : -4.25}>
          {action}
        </MDBox>
        <MDTypography variant="h5" fontWeight="regular" sx={{ mt: 4 }}>
          {title}
        </MDTypography>
        <MDTypography variant="body2" color="text" sx={{ mt: 1.5, mb: 1 }}>
          {description}
        </MDTypography>
      </MDBox>
      <Divider />
      <MDBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        pt={0.5}
        pb={3}
        px={3}
        lineHeight={1}>
        <MDTypography variant="body2" fontWeight="regular" color="text">
          {price}
        </MDTypography>
        <MDBox color="text" display="flex" alignItems="center">
          <Icon color="inherit" sx={{ m: 0.5 }}>
            place
          </Icon>
          <MDTypography variant="button" fontWeight="light" color="text">
            {location}
          </MDTypography>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for BookingCard
BookingCard.defaultProps = {
  action: false,
}

export default BookingCard
