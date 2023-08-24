// ** Layout Import
import BlankLayout from '#/ui/layouts/BlankLayout'

// ** Component Import
import Error401 from '~/pages/401'

const Error = () => <Error401 />
Error.getLayout = (page) => <BlankLayout>{page}</BlankLayout>

export default Error
