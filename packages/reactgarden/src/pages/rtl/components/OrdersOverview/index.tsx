// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// ThreeD Garden examples components
import TimelineItem from "~/components/examples/Timeline/TimelineItem"

function OrdersOverview(): JSX.Element {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={3} px={3}>
        <MDTypography variant="h6" fontWeight="medium">
          نظرة عامة على الطلبات
        </MDTypography>
        <MDBox mt={0} mb={2}>
          <MDTypography variant="button" color="text" fontWeight="regular">
            <MDTypography
              display="inline"
              variant="body2"
              verticalAlign="middle">
              <Icon sx={{ color: ({ palette: { success } }) => success.main }}>
                arrow_upward
              </Icon>
            </MDTypography>
            &nbsp;
            <MDTypography variant="button" color="text" fontWeight="medium">
              24%
            </MDTypography>{" "}
            هذا الشهر
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDBox p={2}>
        <TimelineItem
          color="success"
          icon="notifications"
          title="$2400, تغييرات في التصميم"
          dateTime="22 ديسمبر 7:20 مساءً"
        />
        <TimelineItem
          color="error"
          icon="inventory_2"
          title="طلب جديد # 1832412"
          dateTime="21 ديسمبر 11 م"
        />
        <TimelineItem
          color="info"
          icon="shopping_cart"
          title="مدفوعات الخادم لشهر أبريل"
          dateTime="21 ديسمبر 9:34 مساءً"
        />
        <TimelineItem
          color="warning"
          icon="payment"
          title="تمت إضافة بطاقة جديدة للأمر رقم 4395133"
          dateTime="20 ديسمبر 2:20 صباحًا"
        />
        <TimelineItem
          color="primary"
          icon="vpn_key"
          title="فتح الحزم من أجل التطوير"
          dateTime="18 ديسمبر ، 4:54 صباحًا"
          lastItem
        />
      </MDBox>
    </Card>
  )
}

export default OrdersOverview
