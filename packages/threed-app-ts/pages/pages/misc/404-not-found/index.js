// ** Layout Import
import BlankLayout from '~/@core/layouts/BlankLayout'

// ** Component Import
import Error404 from '~/pages/404'

const Error = () => <Error404 />
Error.getLayout = (page) => <BlankLayout>{page}</BlankLayout>

export default Error
