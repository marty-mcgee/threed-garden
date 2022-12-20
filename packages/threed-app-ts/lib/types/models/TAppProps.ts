// import { loadAppConfig } from '#/lib/config/app.config';

// export type TAppConfig = Awaited<ReturnType<typeof loadAppConfig>>;

export type TAppProps = {
  config: never
}

export type TPageProps = {
  appProps: TAppProps
  getLayout: Function | Boolean
  setConfig: Function | Boolean
  authGuard: Boolean
  guestGuard: Boolean
  acl: Object
}
