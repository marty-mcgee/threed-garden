'use client'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import Email from '#/ui/modules/email/Email'

const EmailApp = ({ folder }) => {
  return <Email folder={folder} />
}

export const getStaticPaths = async () => {
  let data = []
  try {
    const res = await axios.get('/api/modules/email/allEmails')
    data = await res.data.emails
  } catch (e) {
    data = []
  }

  const paths = data.map((mail) => ({
    params: { folder: mail.folder },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = ({ params }) => {
  return {
    props: {
      folder: params?.folder,
    },
  }
}

export default EmailApp
