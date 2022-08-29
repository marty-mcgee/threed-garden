// ** React Imports
import { useEffect, useState, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'

// ** ThirdParty Components
import axios from 'axios'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** renders client column
const renderClient = params => {
  const { row } = params
  const stateNum = Math.floor(Math.random() * 6)
  const states = ['success', 'error', 'warning', 'info', 'primary', 'secondary']
  const color = states[stateNum]
  if (row.avatar.length) {
    return <CustomAvatar src={`/images/avatars/${row.avatar}`} sx={{ mr: 3, width: '1.875rem', height: '1.875rem' }} />
  } else {
    return (
      <CustomAvatar skin='light' color={color} sx={{ mr: 3, fontSize: '.8rem', width: '1.875rem', height: '1.875rem' }}>
        {getInitials(row.full_name ? row.full_name : 'John Doe')}
      </CustomAvatar>
    )
  }
}

const statusObj = {
  1: { title: 'current', color: 'primary' },
  2: { title: 'professional', color: 'success' },
  3: { title: 'rejected', color: 'error' },
  4: { title: 'resigned', color: 'warning' },
  5: { title: 'applied', color: 'info' }
}

const columns = [
  {
    flex: 0.25,
    minWidth: 290,
    field: 'full_name',
    headerName: 'Name',
    renderCell: params => {
      const { row } = params

      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderClient(params)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
              {row.full_name}
            </Typography>
            <Typography noWrap variant='caption'>
              {row.email}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.175,
    minWidth: 120,
    headerName: 'Date',
    field: 'start_date',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.start_date}
      </Typography>
    )
  },
  {
    flex: 0.175,
    minWidth: 110,
    field: 'salary',
    headerName: 'Salary',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.salary}
      </Typography>
    )
  },
  {
    flex: 0.125,
    field: 'age',
    minWidth: 80,
    headerName: 'Age',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.age}
      </Typography>
    )
  },
  {
    flex: 0.175,
    minWidth: 140,
    field: 'status',
    headerName: 'Status',
    renderCell: params => {
      const status = statusObj[params.row.status]

      return (
        <CustomChip
          size='small'
          skin='light'
          color={status.color}
          label={status.title}
          sx={{ '& .MuiChip-label': { textTransform: 'capitalize' } }}
        />
      )
    }
  }
]

const TableServerSide = () => {
  // ** State
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [pageSize, setPageSize] = useState(7)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('full_name')
  function loadServerRows(currentPage, data) {
    return data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  }

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      await axios
        .get('/api/table/data', {
          params: {
            q,
            sort,
            column
          }
        })
        .then(res => {
          setTotal(res.data.total)
          setRows(loadServerRows(page, res.data.data))
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, pageSize]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData, searchValue, sort, sortColumn])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
      setSort('asc')
      setSortColumn('full_name')
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    fetchTableData(sort, value, sortColumn)
  }

  return (
    <Card>
      <CardHeader title='Server Side' />
      <DataGrid
        autoHeight
        pagination
        rows={rows}
        rowCount={total}
        columns={columns}
        checkboxSelection
        pageSize={pageSize}
        sortingMode='server'
        paginationMode='server'
        onSortModelChange={handleSortModel}
        rowsPerPageOptions={[7, 10, 25, 50]}
        onPageChange={newPage => setPage(newPage)}
        components={{ Toolbar: ServerSideToolbar }}
        onPageSizeChange={newPageSize => setPageSize(newPageSize)}
        componentsProps={{
          toolbar: {
            value: searchValue,
            clearSearch: () => handleSearch(''),
            onChange: event => handleSearch(event.target.value)
          }
        }}
      />
    </Card>
  )
}

export default TableServerSide
