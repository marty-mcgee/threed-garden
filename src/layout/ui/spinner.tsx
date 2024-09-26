// ** RADIX-UI Imports
import { Spinner, Flex } from '@radix-ui/themes'

// const spinnerColor = '#96C02E' // ThreeD Light Green
const spinnerColor = '#4C9900' // ThreeD Green

const FallbackSpinner = () => {
  return (
    // <Flex align='center' gap='4'>
      <Spinner size={'3'} loading={true} />
    // </Flex>
  )
}

export default FallbackSpinner
