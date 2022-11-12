import { ReactNode } from 'react'

// @mui material components
import Icon from '@mui/material/Icon'
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'

// ThreeD Garden contexts
import { useMaterialUIController } from '~/context'

// Declaring props types for DataTableHeadCell
interface Props {
  width?: string | number
  children: ReactNode
  sorted?: false | 'none' | 'asce' | 'desc'
  align?: 'left' | 'right' | 'center'
}

function DataTableHeadCell({ width, children, sorted, align, ...rest }: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <MDBox
      component='th'
      width={width}
      py={1.5}
      px={3}
      sx={({ palette: { light }, borders: { borderWidth } }: Theme) => ({
        borderBottom: `${borderWidth[1]} solid ${light.main}`,
      })}
    >
      <MDBox
        {...rest}
        position='relative'
        textAlign={align}
        color={darkMode ? 'white' : 'secondary'}
        opacity={0.7}
        sx={({ typography: { size, fontWeightBold } }: Theme) => ({
          fontSize: size.xxs,
          fontWeight: fontWeightBold,
          textTransform: 'uppercase',
          cursor: sorted && 'pointer',
          userSelect: sorted && 'none',
        })}
      >
        {children}
        {sorted && (
          <MDBox
            position='absolute'
            top={0}
            right={align !== 'right' ? '16px' : 0}
            left={align === 'right' ? '-5px' : 'unset'}
            sx={({ typography: { size } }: any) => ({
              fontSize: size.lg,
            })}
          >
            <MDBox
              position='absolute'
              top={-6}
              color={sorted === 'asce' ? 'text' : 'secondary'}
              opacity={sorted === 'asce' ? 1 : 0.5}
            >
              <Icon>arrow_drop_up</Icon>
            </MDBox>
            <MDBox
              position='absolute'
              top={0}
              color={sorted === 'desc' ? 'text' : 'secondary'}
              opacity={sorted === 'desc' ? 1 : 0.5}
            >
              <Icon>arrow_drop_down</Icon>
            </MDBox>
          </MDBox>
        )}
      </MDBox>
    </MDBox>
  )
}

// Declaring default props for DataTableHeadCell
DataTableHeadCell.defaultProps = {
  width: 'auto',
  sorted: 'none',
  align: 'left',
}

export default DataTableHeadCell
