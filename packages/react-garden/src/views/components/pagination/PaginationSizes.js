// ** MUI Imports
import Pagination from '@mui/material/Pagination'

const PaginationSizes = () => {
  return (
    <div className='demo-space-y'>
      <Pagination count={10} size='small' />
      <Pagination count={10} />
      <Pagination count={10} size='large' />
    </div>
  )
}

export default PaginationSizes
