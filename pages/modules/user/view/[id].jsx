'use client'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import UserViewPage from '#/ui/modules/user/view/UserViewPage'

const UserView = ({ id, invoiceData }) => {
  return <UserViewPage id={id} invoiceData={invoiceData} />
}

export const getStaticPaths = async () => {
  const res = await axios.get('/ui/modules/users/list')
  const userDate = await res.data.allData

  const paths = userDate.map((item) => ({
    params: { id: `${item.id}` },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({ params }) => {
  const res = await axios.get('/ui/modules/invoice/invoices')
  const invoiceData = res.data.allData

  return {
    props: {
      invoiceData,
      id: params?.id,
    },
  }
}

export default UserView
