'use client'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import UserViewPage from '#/ui/modules/user/view/UserViewPage'

const UserView = ({ invoiceData }) => {
  return <UserViewPage id='1' invoiceData={invoiceData} />
}

export const getStaticProps = async () => {
  const res = await axios.get('/modules/invoice/invoices')
  const invoiceData = res.data.allData

  return {
    props: {
      invoiceData,
    },
  }
}

export default UserView
