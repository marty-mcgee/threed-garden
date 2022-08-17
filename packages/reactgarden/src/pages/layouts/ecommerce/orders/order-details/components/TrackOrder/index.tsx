// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// ThreeD Garden examples components
import TimelineItem from "~/components/examples/Timeline/TimelineItem"

function OrdersOverview(): JSX.Element {
  return (
    <>
      <MDTypography variant="h6" fontWeight="medium">
        Track order
      </MDTypography>
      <MDBox mt={2}>
        <TimelineItem
          color="secondary"
          icon="notifications"
          title="Order received"
          dateTime="22 DEC 7:20 PM"
        />
        <TimelineItem
          color="secondary"
          icon="inventory_2"
          title="Generate order id #1832412"
          dateTime="22 DEC 7:21 AM"
        />
        <TimelineItem
          color="secondary"
          icon="shopping_cart"
          title="Order transmited to courier"
          dateTime="22 DEC 8:10 AM"
        />
        <TimelineItem
          color="success"
          icon="done"
          title="Order delivered"
          dateTime="22 DEC 4:54 PM"
          lastItem
        />
      </MDBox>
    </>
  )
}

export default OrdersOverview
