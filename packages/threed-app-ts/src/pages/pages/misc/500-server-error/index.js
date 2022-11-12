// ** Layout Import
import BlankLayout from '~/@core/layouts/BlankLayout'

// ** Component Import
import Error500 from '~/pages/500'

const Error = () => <Error500 />
Error.getLayout = (page) => <BlankLayout>{page}</BlankLayout>

export default Error
