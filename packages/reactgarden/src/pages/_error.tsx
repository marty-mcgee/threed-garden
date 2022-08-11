// ================================

// APPROACH MM -- from NextJS.org > API Routes > Response Helpers > Adding TypeScript Types
// https://nextjs.org/docs/api-routes/response-helpers#adding-typescript-types
// import type { NextApiRequest, NextApiResponse } from 'next'

// type ResponseData = {
//   message: string
// }

// // export default function Error(
// export default function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ) {
//   res.status(200).json({ message: 'HEY HEY HEY -- Error Message from Next.js!' })
//   return (
//     <p>
//       {res.status
//         ? `An error ${res.status} occurred on server`
//         : "An error occurred on client"}
//     </p>
//   )
// }

// ================================
// ORIGINAL QUESTION:
// https://stackoverflow.com/questions/69091242/nextjs-how-to-type-error-page-with-typescript
// APPROACH 1 -- from the questioner (seems to work)
import type { NextApiRequest, NextApiResponse } from 'next'

interface ErrorProps {
  statusCode: number
}
function Error({ statusCode }: ErrorProps) {
  return (
    <p>
      {statusCode
        ? `Status code ${statusCode} occurred on server`
        : "Status code Unknown/Error occurred on client"}
    </p>
  )
}

interface InitialProps {
  res: NextApiResponse
  err: NextApiResponse
}
Error.getInitialProps = ({ res, err }: InitialProps) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error

// ================================

// APPROACH 2 -- suggested to use NextJS.org example for Data Fetching: getInitialProps
// https://nextjs.org/docs/api-reference/data-fetching/get-initial-props#typescript

// import { NextPage, NextPageContext } from 'next'

// interface Props {
//   statusCode?: number
// }

// const Error: NextPage<Props> = ({ statusCode }) => (
//   <p>
//     {statusCode
//       ? `Status code ${statusCode} occurred on server`
//       : "Status code Unknown/Error occurred on client"}
//   </p>
// )

// Error.getInitialProps = ({ res, err }: NextPageContext) => {
//   const statusCode = res ? res.statusCode : err ? err.statusCode : 404
//   return { statusCode }
// }

// export default Error

