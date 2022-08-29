// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Component Import
import Error404 from 'src/pages/404'

const Error = () => <Error404 />
Error.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default Error
