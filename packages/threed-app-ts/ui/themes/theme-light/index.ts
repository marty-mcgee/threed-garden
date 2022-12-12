// @mui material components
import { createTheme } from '@mui/material'

// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'
import breakpoints from '~/ui/themes/theme-light/base/breakpoints'
import typography from '~/ui/themes/theme-light/base/typography'
import boxShadows from '~/ui/themes/theme-light/base/boxShadows'
import borders from '~/ui/themes/theme-light/base/borders'
import globals from '~/ui/themes/theme-light/base/globals'

// ThreeD Garden Helper Functions
import boxShadow from '~/ui/themes/theme-light/functions/boxShadow'
import hexToRgb from '~/ui/themes/theme-light/functions/hexToRgb'
import linearGradient from '~/ui/themes/theme-light/functions/linearGradient'
import pxToRem from '~/ui/themes/theme-light/functions/pxToRem'
import rgba from '~/ui/themes/theme-light/functions/rgba'

// ThreeD Garden components base styles for @mui material components
import sidenav from '~/ui/themes/theme-light/components/sidenav'
import list from '~/ui/themes/theme-light/components/list'
import listItem from '~/ui/themes/theme-light/components/list/listItem'
import listItemText from '~/ui/themes/theme-light/components/list/listItemText'
import card from '~/ui/themes/theme-light/components/card'
import cardMedia from '~/ui/themes/theme-light/components/card/cardMedia'
import cardContent from '~/ui/themes/theme-light/components/card/cardContent'
import button from '~/ui/themes/theme-light/components/button'
import iconButton from '~/ui/themes/theme-light/components/iconButton'
import input from '~/ui/themes/theme-light/components/form/input'
import inputLabel from '~/ui/themes/theme-light/components/form/inputLabel'
import inputOutlined from '~/ui/themes/theme-light/components/form/inputOutlined'
import textField from '~/ui/themes/theme-light/components/form/textField'
import menu from '~/ui/themes/theme-light/components/menu'
import menuItem from '~/ui/themes/theme-light/components/menu/menuItem'
import switchButton from '~/ui/themes/theme-light/components/form/switchButton'
import divider from '~/ui/themes/theme-light/components/divider'
import tableContainer from '~/ui/themes/theme-light/components/table/tableContainer'
import tableHead from '~/ui/themes/theme-light/components/table/tableHead'
import tableCell from '~/ui/themes/theme-light/components/table/tableCell'
import linearProgress from '~/ui/themes/theme-light/components/linearProgress'
import breadcrumbs from '~/ui/themes/theme-light/components/breadcrumbs'
import slider from '~/ui/themes/theme-light/components/slider'
import avatar from '~/ui/themes/theme-light/components/avatar'
import tooltip from '~/ui/themes/theme-light/components/tooltip'
import appBar from '~/ui/themes/theme-light/components/appBar'
import tabs from '~/ui/themes/theme-light/components/tabs'
import tab from '~/ui/themes/theme-light/components/tabs/tab'
import stepper from '~/ui/themes/theme-light/components/stepper'
import step from '~/ui/themes/theme-light/components/stepper/step'
import stepConnector from '~/ui/themes/theme-light/components/stepper/stepConnector'
import stepLabel from '~/ui/themes/theme-light/components/stepper/stepLabel'
import stepIcon from '~/ui/themes/theme-light/components/stepper/stepIcon'
import select from '~/ui/themes/theme-light/components/form/select'
import formControlLabel from '~/ui/themes/theme-light/components/form/formControlLabel'
import formLabel from '~/ui/themes/theme-light/components/form/formLabel'
import checkbox from '~/ui/themes/theme-light/components/form/checkbox'
import radio from '~/ui/themes/theme-light/components/form/radio'
import autocomplete from '~/ui/themes/theme-light/components/form/autocomplete'
import flatpickr from '~/ui/themes/theme-light/components/flatpickr'
import container from '~/ui/themes/theme-light/components/container'
import popover from '~/ui/themes/theme-light/components/popover'
import buttonBase from '~/ui/themes/theme-light/components/buttonBase'
import icon from '~/ui/themes/theme-light/components/icon'
import svgIcon from '~/ui/themes/theme-light/components/svgIcon'
import link from '~/ui/themes/theme-light/components/link'
import dialog from '~/ui/themes/theme-light/components/dialog'
import dialogTitle from '~/ui/themes/theme-light/components/dialog/dialogTitle'
import dialogContent from '~/ui/themes/theme-light/components/dialog/dialogContent'
import dialogContentText from '~/ui/themes/theme-light/components/dialog/dialogContentText'
import dialogActions from '~/ui/themes/theme-light/components/dialog/dialogActions'

export default createTheme({
  breakpoints: { ...breakpoints },
  palette: { ...colors },
  typography: { ...typography },
  boxShadows: { ...boxShadows },
  borders: { ...borders },
  functions: {
    boxShadow,
    hexToRgb,
    linearGradient,
    pxToRem,
    rgba,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...globals,
        ...flatpickr,
        ...container,
      },
    },
    MuiDrawer: { ...sidenav },
    MuiList: { ...list },
    MuiListItem: { ...listItem },
    MuiListItemText: { ...listItemText },
    MuiCard: { ...card },
    MuiCardMedia: { ...cardMedia },
    MuiCardContent: { ...cardContent },
    MuiButton: { ...button },
    MuiIconButton: { ...iconButton },
    MuiInput: { ...input },
    MuiInputLabel: { ...inputLabel },
    MuiOutlinedInput: { ...inputOutlined },
    MuiTextField: { ...textField },
    MuiMenu: { ...menu },
    MuiMenuItem: { ...menuItem },
    MuiSwitch: { ...switchButton },
    MuiDivider: { ...divider },
    MuiTableContainer: { ...tableContainer },
    MuiTableHead: { ...tableHead },
    MuiTableCell: { ...tableCell },
    MuiLinearProgress: { ...linearProgress },
    MuiBreadcrumbs: { ...breadcrumbs },
    MuiSlider: { ...slider },
    MuiAvatar: { ...avatar },
    MuiTooltip: { ...tooltip },
    MuiAppBar: { ...appBar },
    MuiTabs: { ...tabs },
    MuiTab: { ...tab },
    MuiStepper: { ...stepper },
    MuiStep: { ...step },
    MuiStepConnector: { ...stepConnector },
    MuiStepLabel: { ...stepLabel },
    MuiStepIcon: { ...stepIcon },
    MuiSelect: { ...select },
    MuiFormControlLabel: { ...formControlLabel },
    MuiFormLabel: { ...formLabel },
    MuiCheckbox: { ...checkbox },
    MuiRadio: { ...radio },
    MuiAutocomplete: { ...autocomplete },
    MuiPopover: { ...popover },
    MuiButtonBase: { ...buttonBase },
    MuiIcon: { ...icon },
    MuiSvgIcon: { ...svgIcon },
    MuiLink: { ...link },
    MuiDialog: { ...dialog },
    MuiDialogTitle: { ...dialogTitle },
    MuiDialogContent: { ...dialogContent },
    MuiDialogContentText: { ...dialogContentText },
    MuiDialogActions: { ...dialogActions },
  },
})
