// WORKING EXAMPLE OF NEXTJS _error.js

const Error = ({ statusCode }) => (
  <p>
    {statusCode
      ? `Status code ${statusCode} occurred on server`
      : "Status code Unknown/Error occurred on client"}
  </p>
)

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
