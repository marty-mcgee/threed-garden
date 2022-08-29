// ** MUI Imports
import Pagination from '@mui/material/Pagination'

const PaginationButtons = () => {
  return (
    <div className='demo-space-y'>
      <Pagination count={10} showFirstButton showLastButton />
      <Pagination count={10} hidePrevButton hideNextButton />
    </div>
  )
}

export default PaginationButtons
