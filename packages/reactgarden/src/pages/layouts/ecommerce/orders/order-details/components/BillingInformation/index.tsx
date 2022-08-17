// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// ThreeD Garden context
import { useMaterialUIController } from "~/context"

function BillingInformation(): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <>
      <MDTypography variant="h6" fontWeight="medium">
        Billing Information
      </MDTypography>
      <MDBox
        component="li"
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        bgColor={darkMode ? "transparent" : "grey-100"}
        borderRadius="lg"
        p={3}
        mt={2}>
        <MDBox
          width="100%"
          display="flex"
          flexDirection="column"
          lineHeight={1}>
          <MDBox mb={2}>
            <MDTypography
              variant="button"
              fontWeight="medium"
              textTransform="capitalize">
              Oliver Liam
            </MDTypography>
          </MDBox>
          <MDBox mb={1} lineHeight={0}>
            <MDTypography variant="caption" fontWeight="regular" color="text">
              Company Name:&nbsp;&nbsp;&nbsp;
              <MDTypography
                variant="caption"
                fontWeight="medium"
                textTransform="capitalize">
                Viking Burrito
              </MDTypography>
            </MDTypography>
          </MDBox>
          <MDBox mb={1} lineHeight={0}>
            <MDTypography variant="caption" fontWeight="regular" color="text">
              Email Address:&nbsp;&nbsp;&nbsp;
              <MDTypography variant="caption" fontWeight="medium">
                oliver@burrito.com
              </MDTypography>
            </MDTypography>
          </MDBox>
          <MDTypography variant="caption" fontWeight="regular" color="text">
            VAT Number:&nbsp;&nbsp;&nbsp;
            <MDTypography variant="caption" fontWeight="medium">
              FRB1235476
            </MDTypography>
          </MDTypography>
        </MDBox>
      </MDBox>
    </>
  )
}

export default BillingInformation
