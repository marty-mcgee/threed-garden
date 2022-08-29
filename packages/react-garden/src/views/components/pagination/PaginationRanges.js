// ** MUI Imports
import Pagination from '@mui/material/Pagination'

const PaginationRanges = () => {
  return (
    <div className='demo-space-y'>
      <Pagination count={11} defaultPage={6} siblingCount={0} />
      <Pagination count={11} defaultPage={6} />
      <Pagination count={11} defaultPage={6} siblingCount={0} boundaryCount={2} />
      <Pagination count={11} defaultPage={6} boundaryCount={2} />
    </div>
  )
}

export default PaginationRanges
