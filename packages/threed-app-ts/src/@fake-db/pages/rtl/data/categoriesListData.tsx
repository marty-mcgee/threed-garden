// ThreeD Garden components
import MDTypography from '~/components/mui/MDTypography'

// types
type Types = any

const categoriesListData: Types = [
  {
    color: 'dark',
    icon: 'launch',
    name: 'الأجهزة',
    description: (
      <>
        250 في المخزن,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          346+ تم البيع
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'book_online',
    name: 'تذاكر',
    description: (
      <>
        123 مغلق,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          15 افتح
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'priority_high',
    name: 'سجلات الخطأ',
    description: (
      <>
        1 is نشيط,{' '}
        <MDTypography
          variant='caption'
          color='text'
          fontWeight='medium'
        >
          40 مغلق
        </MDTypography>
      </>
    ),
    route: '/',
  },
  {
    color: 'dark',
    icon: 'insert_emoticon',
    name: 'المستخدمين السعداء',
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
