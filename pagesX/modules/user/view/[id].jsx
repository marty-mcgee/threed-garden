'use client'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import UserViewPage from '#/ui/modules/user/view/UserViewPage'

const UserView = ({ id, invoiceData }) => {
  return <UserViewPage id={id} invoiceData={invoiceData} />
}

export const getStaticPaths = async () => {
  let data = []
  try {
    const res = await axios.get('/api/modules/users/list')
    data = await res.data.allData
  } catch (e) {
    data = []
  }

  const paths = data.map((item) => ({
    params: { id: `${item.id}` },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = async ({ params }) => {
  let data = []
  try {
    const res = await axios.get('/api/modules/invoice/invoices')
    data = await res.data.allData
  } catch (e) {
    data = []
  }

  return {
    props: {
      invoiceData: data,
      id: params?.id,
    },
  }
}

export default UserView
