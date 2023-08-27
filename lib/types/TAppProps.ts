// import { loadAppConfig } from '#/lib/config/app.config';

// export type TAppConfig = Awaited<ReturnType<typeof loadAppConfig>>;

// *****************************************************************
// import type AppProps from 'next/app'
import type { NextPage } from 'next'

type TPageAuth = {
  role: string
  loading: JSX.Element
  unauthorized: string
};

// export type TNextPageWithAuth<P = {}, IP = P> = NextPage<P, IP> & {
//   auth: TPageAuth
// };

// const AdminDashboard: TNextPageWithAuth = () => {
//   // Your `AdminDashboard` code here
// };

// AdminDashboard.auth = {
//   role: "admin",
//   loading: <AdminLoadingSkeleton />,
//   unauthorized: "/login-with-different-user"
// };

// export default AdminDashboard

// *****************************************************************

// export type TAppProps = AppProps
// export type TAppProps = {
export type TAppProps = {
  config: never
}

export type TNextPageWithProps<P = {}, IP = P> = NextPage<P, IP> & {
  appProps?: TAppProps
  getLayout?: Function | Boolean
  setConfig?: Function | Boolean
  authGuard?: Boolean
  guestGuard?: Boolean
  acl?: Object
  auth?: TPageAuth
}

export type TPageProps = {
// export type TPageProps = AppProps & {
  // appProps: AppProps
  appProps: TAppProps
  getLayout: Function | Boolean
  setConfig: Function | Boolean
  authGuard: Boolean
  guestGuard: Boolean
  acl: Object
}
