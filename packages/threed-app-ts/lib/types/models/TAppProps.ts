// import { loadAppConfig } from '#/lib/config/app.config';

// export type TAppConfig = Awaited<ReturnType<typeof loadAppConfig>>;

export type TAppProps = {
  config: never
}

export type TPageProps = {
  appProps: TAppProps
  getLayout: Function | boolean
  setConfig: Function | boolean
  authGuard: boolean
  guestGuard: boolean
  acl: Object
}
