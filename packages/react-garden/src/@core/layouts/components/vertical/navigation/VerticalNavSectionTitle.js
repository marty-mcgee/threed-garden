// ** MUI Imports
import Divider from '@mui/material/Divider'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiListSubheader from '@mui/material/ListSubheader'

// ** Custom Components Imports
import Translations from 'src/layouts/components/Translations'
import CanViewNavSectionTitle from 'src/layouts/components/acl/CanViewNavSectionTitle'

// ** Styled Components
const ListSubheader = styled(props => <MuiListSubheader component='li' {...props} />)(({ theme }) => ({
  lineHeight: 1,
  display: 'flex',
  position: 'static',
  marginTop: theme.spacing(7),
  marginBottom: theme.spacing(2),
  backgroundColor: 'transparent'
}))

const TypographyHeaderText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  lineHeight: 'normal',
  letterSpacing: '0.21px',
  textTransform: 'uppercase',
  color: theme.palette.text.disabled,
  fontWeight: theme.typography.fontWeightMedium
}))

const VerticalNavSectionTitle = props => {
  // ** Props
  const { item, navHover, settings, collapsedNavWidth, navigationBorderWidth } = props

  // ** Hook
  const theme = useTheme()

  // ** Vars
  const { skin, navCollapsed } = settings

  const conditionalStyling = () => {
    if (skin === 'semi-dark' && theme.palette.mode === 'light') {
      return {
        color: `rgba(${theme.palette.customColors.dark}, 0.38)`,
        '& .MuiDivider-root:before, & .MuiDivider-root:after, & hr': {
          borderColor: `rgba(${theme.palette.customColors.dark}, ${navCollapsed && !navHover ? 0.3 : 0.12})`
        }
      }
    } else if (skin === 'semi-dark' && theme.palette.mode === 'dark') {
      return {
        color: `rgba(${theme.palette.customColors.light}, 0.38)`,
        '& .MuiDivider-root:before, & .MuiDivider-root:after, & hr': {
          borderColor: `rgba(${theme.palette.customColors.light}, ${navCollapsed && !navHover ? 0.3 : 0.12})`
        }
      }
    } else {
      return {
        color: theme.palette.text.disabled,
        '& .MuiDivider-root:before, & .MuiDivider-root:after, & hr': {
          borderColor: `rgba(${theme.palette.customColors.main}, ${navCollapsed && !navHover ? 0.3 : 0.12})`
        }
      }
    }
  }

  return (
    <CanViewNavSectionTitle navTitle={item}>
      <ListSubheader
        className='nav-section-title'
        sx={{
          ...conditionalStyling(),
          ...(navCollapsed && !navHover
            ? {
                py: 3.5,
                pr: (collapsedNavWidth - navigationBorderWidth - 24) / 8 - 1,
                pl: (collapsedNavWidth - navigationBorderWidth - 24) / 8 + 0.25
              }
            : { px: 0, py: 1.75 })
        }}
      >
        <Divider
          textAlign='left'
          sx={{
            m: 0,
            lineHeight: 'normal',
            ...(navCollapsed && !navHover
              ? { width: 22 }
              : {
                  width: '100%',
                  textTransform: 'uppercase',
                  '&:before, &:after': { top: 7, transform: 'none' },
                  '& .MuiDivider-wrapper': { px: 2.5, fontSize: '0.75rem', letterSpacing: '0.21px' }
                })
          }}
        >
          {navCollapsed && !navHover ? null : (
            <TypographyHeaderText noWrap>
              <Translations text={item.sectionTitle} />
            </TypographyHeaderText>
          )}
        </Divider>
      </ListSubheader>
    </CanViewNavSectionTitle>
  )
}

export default VerticalNavSectionTitle
