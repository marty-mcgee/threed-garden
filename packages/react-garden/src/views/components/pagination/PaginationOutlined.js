// ** MUI Imports
import Pagination from '@mui/material/Pagination'

const PaginationOutlined = () => {
  return (
    <div className='demo-space-y'>
      <Pagination count={10} variant='outlined' />
      <Pagination count={10} variant='outlined' color='primary' />
      <Pagination count={10} variant='outlined' color='secondary' />
    </div>
  )
}

export default PaginationOutlined
