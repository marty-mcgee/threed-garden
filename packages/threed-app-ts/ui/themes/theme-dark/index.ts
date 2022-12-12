// @mui material components
import { createTheme } from '@mui/material/styles'
// import Fade from "@mui/material/Fade";

// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-dark/base/colors'
import breakpoints from '~/ui/themes/theme-dark/base/breakpoints'
import typography from '~/ui/themes/theme-dark/base/typography'
import boxShadows from '~/ui/themes/theme-dark/base/boxShadows'
import borders from '~/ui/themes/theme-dark/base/borders'
import globals from '~/ui/themes/theme-dark/base/globals'

// ThreeD Garden Helper Functions
import boxShadow from '~/ui/themes/theme-dark/functions/boxShadow'
import hexToRgb from '~/ui/themes/theme-dark/functions/hexToRgb'
import linearGradient from '~/ui/themes/theme-dark/functions/linearGradient'
import pxToRem from '~/ui/themes/theme-dark/functions/pxToRem'
import rgba from '~/ui/themes/theme-dark/functions/rgba'

// ThreeD Garden components base styles for @mui material components
import sidenav from '~/ui/themes/theme-dark/components/sidenav'
import list from '~/ui/themes/theme-dark/components/list'
import listItem from '~/ui/themes/theme-dark/components/list/listItem'
import listItemText from '~/ui/themes/theme-dark/components/list/listItemText'
import card from '~/ui/themes/theme-dark/components/card'
import cardMedia from '~/ui/themes/theme-dark/components/card/cardMedia'
import cardContent from '~/ui/themes/theme-dark/components/card/cardContent'
import button from '~/ui/themes/theme-dark/components/button'
import iconButton from '~/ui/themes/theme-dark/components/iconButton'
import input from '~/ui/themes/theme-dark/components/form/input'
import inputLabel from '~/ui/themes/theme-dark/components/form/inputLabel'
import inputOutlined from '~/ui/themes/theme-dark/components/form/inputOutlined'
import textField from '~/ui/themes/theme-dark/components/form/textField'
import menu from '~/ui/themes/theme-dark/components/menu'
import menuItem from '~/ui/themes/theme-dark/components/menu/menuItem'
import switchButton from '~/ui/themes/theme-dark/components/form/switchButton'
import divider from '~/ui/themes/theme-dark/components/divider'
import tableContainer from '~/ui/themes/theme-dark/components/table/tableContainer'
import tableHead from '~/ui/themes/theme-dark/components/table/tableHead'
import tableCell from '~/ui/themes/theme-dark/components/table/tableCell'
import linearProgress from '~/ui/themes/theme-dark/components/linearProgress'
import breadcrumbs from '~/ui/themes/theme-dark/components/breadcrumbs'
import slider from '~/ui/themes/theme-dark/components/slider'
import avatar from '~/ui/themes/theme-dark/components/avatar'
import tooltip from '~/ui/themes/theme-dark/components/tooltip'
import appBar from '~/ui/themes/theme-dark/components/appBar'
import tabs from '~/ui/themes/theme-dark/components/tabs'
import tab from '~/ui/themes/theme-dark/components/tabs/tab'
import stepper from '~/ui/themes/theme-dark/components/stepper'
import step from '~/ui/themes/theme-dark/components/stepper/step'
import stepConnector from '~/ui/themes/theme-dark/components/stepper/stepConnector'
import stepLabel from '~/ui/themes/theme-dark/components/stepper/stepLabel'
import stepIcon from '~/ui/themes/theme-dark/components/stepper/stepIcon'
import select from '~/ui/themes/theme-dark/components/form/select'
import formControlLabel from '~/ui/themes/theme-dark/components/form/formControlLabel'
import formLabel from '~/ui/themes/theme-dark/components/form/formLabel'
import checkbox from '~/ui/themes/theme-dark/components/form/checkbox'
import radio from '~/ui/themes/theme-dark/components/form/radio'
import autocomplete from '~/ui/themes/theme-dark/components/form/autocomplete'
import flatpickr from '~/ui/themes/theme-dark/components/flatpickr'
import container from '~/ui/themes/theme-dark/components/container'
import popover from '~/ui/themes/theme-dark/components/popover'
import buttonBase from '~/ui/themes/theme-dark/components/buttonBase'
import icon from '~/ui/themes/theme-dark/components/icon'
import svgIcon from '~/ui/themes/theme-dark/components/svgIcon'
import link from '~/ui/themes/theme-dark/components/link'
import dialog from '~/ui/themes/theme-dark/components/dialog'
import dialogTitle from '~/ui/themes/theme-dark/components/dialog/dialogTitle'
import dialogContent from '~/ui/themes/theme-dark/components/dialog/dialogContent'
import dialogContentText from '~/ui/themes/theme-dark/components/dialog/dialogContentText'
import dialogActions from '~/ui/themes/theme-dark/components/dialog/dialogActions'

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
