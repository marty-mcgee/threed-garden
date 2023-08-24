// ** Third Party Imports
import axios from 'axios'

// ** Layout Import
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Demo Components Imports
import PrintPage from '#/ui/modules/invoice/print/PrintPage'

const InvoicePrint = ({ id }) => {
  return <PrintPage id={id} />
}

export const getStaticPaths = async () => {
  const res = await axios.get('/modules/invoice/invoices')
  const data = await res.data.allData

  const paths = data.map((item) => ({
    params: { id: `${item.id}` },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = ({ params }) => {
  return {
    props: {
      id: params?.id,
    },
  }
}

InvoicePrint.getLayout = (page) => <BlankLayout>{page}</BlankLayout>
InvoicePrint.setConfig = () => {
  return {
    mode: 'light',
  }
}

export default InvoicePrint
