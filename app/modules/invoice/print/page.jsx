'use client'

// ** Layout Import
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Demo Components Imports
import PrintPage from '#/ui/modules/invoice/print/PrintPage'

const InvoicePrint = () => {
  return <PrintPage id='4987' />
}
InvoicePrint.getLayout = (page) => <BlankLayout>{page}</BlankLayout>
InvoicePrint.setConfig = () => {
  return {
    mode: 'light',
  }
}

export default InvoicePrint
