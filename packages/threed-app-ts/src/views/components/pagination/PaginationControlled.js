// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination'

const PaginationControlled = () => {
  // ** State
  const [page, setPage] = useState(1)

  const handleChange = (event, value) => {
    setPage(value)
  }

  return (
    <div>
      <Typography sx={{ mb: 2 }}>Page: {page}</Typography>
      <Pagination count={10} page={page} onChange={handleChange} />
    </div>
  )
}

export default PaginationControlled
