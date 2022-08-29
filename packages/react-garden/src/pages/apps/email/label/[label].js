// ** Third Party Imports
import axios from 'axios'

// ** Demo Components Imports
import Email from 'src/views/apps/email/Email'

const EmailApp = ({ label }) => {
  return <Email label={label} />
}

export const getStaticPaths = async () => {
  const res = await axios.get('/apps/email/allEmails')
  const data = await res.data.emails

  const paths = data.map(mail => ({
    params: { label: mail.labels[0] }
  }))

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps = ({ params }) => {
  return {
    props: {
      ...(params && params.label ? { label: params.label } : {})
    }
  }
}

export default EmailApp
