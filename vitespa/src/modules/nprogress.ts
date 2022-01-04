import NProgress from 'nprogress'
import { UserModule } from '~/types'

export const install: UserModule = ({ router }) => {
  router.beforeEach(() => { NProgress.start() })
  router.afterEach(() => { NProgress.done() })
}
