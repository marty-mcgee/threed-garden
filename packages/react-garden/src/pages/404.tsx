const Custom404 = () => (
  <h1>404 - Page Not Found</h1>
)
export default Custom404

// ================================

// [MM] APPROACH with TypeScript (moved to events.tsx for testing)
// import type { NextPage } from 'next';
// import { GetServerSideProps } from 'next';
// import axios from 'axios';

// import { Event } from '../types/interfaces';

// const Home: NextPage = ({ events }) => (
//   <div>
//     {events.map((event: Event) => (
//       <div key={event.title}>{event.title}</div>
//     ))}
//   </div>
// );

// // import { Event } from '../ts/interfaces';

// const Custom404: NextPage<{ events: Event[] }> = ({ events }) => (
//   <div>
//     {events.map((event: Event) => (
//       <div key={event.title}>{event.title}</div>
//     ))}
//   </div>
// );

// export const getServerSideProps: GetServerSideProps = async () => {
//   const res = await axios.get<Event[]>(`${process.env.API_URL}/events`);

//   return {
//     props: { events: res.data },
//   };
// };

// // export default { Home, Custom404 };
// export default Custom404;


// ================================

// APPROACH [MM] -- from NextJS.org > API Routes > Response Helpers > Adding TypeScript Types
// https://nextjs.org/docs/api-routes/response-helpers#adding-typescript-types
// RESULTS IN SUCCESS:
// Server Success
// Success: `pages/404` can not have handler, [MM] https://nextjs.org/docs/messages/404-get-initial-props

// import type { NextApiRequest, NextApiResponse } from 'next'

// type ResponseData = {
//   message: string
// }

// // export default function Error(
// export default function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ResponseData>
// ) {
//   // res.status(200).json({ message: 'HEY HEY HEY -- Error Message from Next.js!' })
//   console.log("res", res)
//   return (
//     <h1>
//       HEY HEY HEY -- 404
//       {/* {res.status
//         ? `An error ${res.status} occurred on server`
//         : "An error occurred on client"} */}
//     </h1>
//   )
// }

// ================================

// APPROACH 1 ORIGINAL QUESTION/SOLUTION
// import type { NextApiRequest, NextApiResponse } from 'next'
// RESULTS IN ERROR:
// Server Error
// Error: `pages/404` can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props

// interface ErrorProps {
//   statusCode: number
// }
// function Error({ statusCode }: ErrorProps) {
//   return (
//     <p>
//       {statusCode
//         ? `Status code ${statusCode} occurred on server`
//         : "Status code Unknown/Error occurred on client"}
//     </p>
//   )
// }

// interface InitialProps {
//   res: NextApiResponse
//   err: NextApiResponse
// }
// Error.getInitialProps = ({ res, err }: InitialProps) => {
//   const statusCode = res ? res.statusCode : err ? err.statusCode : 404
//   return { statusCode }
// }

// export default Error

// ================================

// APPROACH 2 -- suggested to use NextJS.org example for Data Fetching: getInitialProps
// https://nextjs.org/docs/api-reference/data-fetching/get-initial-props#typescript
// RESULTS IN ERROR:
// Server Error
// Error: `pages/404` can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props

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


