// ThreeD Garden components
import MDTypography from '~/components/mui/MDTypography'

// types
type Types = any

const categoriesListData: Types = [
  {
    color: 'dark',
    icon: 'launch',
    name: 'Devices',
    description: (
      <>
        250 in stock,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          346+ sold
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'book_online',
    name: 'Tickets',
    description: (
      <>
        123 closed,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          15 open
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'priority_high',
    name: 'Error logs',
    description: (
      <>
        1 is active,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          40 closed
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'insert_emoticon',
    name: 'Happy users',
    description: (
      <MDTypography
        variant='caption'
        color='text'
        fontWeight='medium'
      >
        + 430
      </MDTypography>
    ),
    route: '/',
  },
]

export default categoriesListData
