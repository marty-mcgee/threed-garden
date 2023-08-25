// import { loadAppConfig } from '#/lib/config/app.config';

// export type TAppConfig = Awaited<ReturnType<typeof loadAppConfig>>;

import type AppProps from 'next/app'
/*
// export type TAppProps = {
export type TAppProps = {
  config: never
}

// export type TPageProps = {
export type TPageProps = AppProps & {
  // appProps: AppProps
  appProps: TAppProps
  // getLayout: Function | Boolean
  // setConfig: Function | Boolean
  // authGuard: Boolean
  // guestGuard: Boolean
  // acl: Object
}
*/
export type TAppProps = AppProps
