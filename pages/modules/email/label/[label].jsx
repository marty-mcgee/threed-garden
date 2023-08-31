'use client'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import Email from '#/ui/modules/email/Email'

const EmailApp = ({ label }) => {
  return <Email label={label} />
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
    params: { label: mail.labels[0] },
  }))

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps = ({ params }) => {
  return {
    props: {
      ...(params && params.label ? { label: params.label } : {}),
    },
  }
}

export default EmailApp
