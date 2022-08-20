/* eslint-disable react/prop-types */
// ProductsList page components
import IdCell from "~/pages/ecommerce/orders/order-list/components/IdCell"
import DefaultCell from "~/pages/ecommerce/orders/order-list/components/DefaultCell"
import StatusCell from "~/pages/ecommerce/orders/order-list/components/StatusCell"
import CustomerCell from "~/pages/ecommerce/orders/order-list/components/CustomerCell"

// Images
import team1 from "~/assets/images/people/team-1.jpg"
import team2 from "~/assets/images/people/team-2.jpg"
import team3 from "~/assets/images/people/team-3.jpg"
import team4 from "~/assets/images/people/team-4.jpg"
import team5 from "~/assets/images/people/team-5.jpg"
import ivana from "~/assets/images/people/ivana-squares.jpg"

const dataTableData = {
  columns: [
    {
      Header: "id",
      accessor: "id",
      Cell: ({ value }: any) => <IdCell id={value} />,
    },
    {
      Header: "date",
      accessor: "date",
      Cell: ({ value }: any) => <DefaultCell value={value} />,
    },
    {
      Header: "status",
      accessor: "status",
      Cell: ({ value }: any) => {
        let status

        if (value === "paid") {
          status = <StatusCell icon="done" color="success" status="Paid" />
        } else if (value === "refunded") {
          status = <StatusCell icon="replay" color="dark" status="Refunded" />
        } else {
          status = <StatusCell icon="close" color="error" status="Canceled" />
        }

        return status
      },
    },
    {
      Header: "customer",
      accessor: "customer",
      Cell: ({ value: [name, data] }: any) => (
        <CustomerCell
          image={data.image}
          color={data.color || "dark"}
          name={name}
        />
      ),
    },
    {
      Header: "product",
      accessor: "product",
      Cell: ({ value }: any) => {
        const [name, data] = value

        return (
          <DefaultCell
            value={typeof value === "string" ? value : name}
            suffix={data.suffix || false}
          />
        )
      },
    },
    {
      Header: "revenue",
      accessor: "revenue",
      Cell: ({ value }: any) => <DefaultCell value={value} />,
    },
  ],

  rows: [
    {
      id: "#10421",
      date: "1 Nov, 10:20 AM",
      status: "paid",
      customer: ["Orlando Imieto", { image: team2 }],
      product: "Nike Sport V2",
      revenue: "$140,20",
    },
    {
      id: "#10422",
      date: "1 Nov, 10:53 AM",
      status: "paid",
      customer: ["Alice Murinho", { image: team1 }],
      product: "Valvet T-shirt",
      revenue: "$42,00",
    },
    {
      id: "#10423",
      date: "1 Nov, 11:13 AM",
      status: "refunded",
      customer: ["Michael Mirra", { image: "M" }],
      product: ["Leather Wallet", { suffix: "+1 more" }],
      revenue: "$25,50",
    },
    {
      id: "#10424",
      date: "1 Nov, 12:20 PM",
      status: "paid",
      customer: ["Andrew Nichel", { image: team3 }],
      product: "Bracelet Onu-Lino",
      revenue: "$19,40",
    },
    {
      id: "#10425",
      date: "1 Nov, 1:40 PM",
      status: "canceled",
      customer: ["Sebastian Koga", { image: team4 }],
      product: ["Phone Case Pink", { suffix: "x 2" }],
      revenue: "$44,90",
    },
    {
      id: "#10426",
      date: "1 Nov, 2:19 PM",
      status: "paid",
      customer: ["Laur Gilbert", { image: "L" }],
      product: "Backpack Niver",
      revenue: "$112,50",
    },
    {
      id: "#10427",
      date: "1 Nov, 3:42 AM",
      status: "paid",
      customer: ["Iryna Innda", { image: "I" }],
      product: "Adidas Vio",
      revenue: "$200,00",
    },
    {
      id: "#10428",
      date: "2 Nov, 9:32 AM",
      status: "paid",
      customer: ["Arrias Liunda", { image: "A" }],
      product: "Airpods 2 Gen",
      revenue: "$350,00",
    },
    {
      id: "#10429",
      date: "2 Nov, 10:14 AM",
      status: "paid",
      customer: ["Rugna Ilpio", { image: team5 }],
      product: "Bracelet Warret",
      revenue: "$15,00",
    },
    {
      id: "#10430",
      date: "2 Nov, 10:14 AM",
      status: "refunded",
      customer: ["Anna Landa", { image: ivana }],
      product: ["Watter Bottle India", { suffix: "x 3" }],
      revenue: "$25,00",
    },
    {
      id: "#10431",
      date: "2 Nov, 3:12 PM",
      status: "paid",
      customer: ["Karl Innas", { image: "K" }],
      product: "Kitchen Gadgets",
      revenue: "$164,90",
    },
    {
      id: "#10432",
      date: "2 Nov, 5:12 PM",
      status: "paid",
      customer: ["Oana Kilas", { image: "O", color: "info" }],
      product: "Office Papers",
      revenue: "$23,90",
    },
  ],
}

export default dataTableData
