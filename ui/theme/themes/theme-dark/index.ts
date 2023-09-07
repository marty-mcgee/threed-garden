// @mui material components
// import type { Theme, ThreedTheme } from '@mui/material/styles' // need this here ??
import { createTheme } from '@mui/material/styles'
// import Fade from "@mui/material/Fade";

// ThreeD Garden Base Styles
import colors from '#/ui/theme/themes/theme-dark/base/colors'
import breakpoints from '#/ui/theme/themes/theme-dark/base/breakpoints'
import typography from '#/ui/theme/themes/theme-dark/base/typography'
import boxShadows from '#/ui/theme/themes/theme-dark/base/boxShadows'
import borders from '#/ui/theme/themes/theme-dark/base/borders'
import globals from '#/ui/theme/themes/theme-dark/base/globals'

// ThreeD Garden Helper Functions
import boxShadow from '#/ui/theme/themes/theme-dark/functions/boxShadow'
import hexToRgb from '#/ui/theme/themes/theme-dark/functions/hexToRgb'
import linearGradient from '#/ui/theme/themes/theme-dark/functions/linearGradient'
import pxToRem from '#/ui/theme/themes/theme-dark/functions/pxToRem'
import rgba from '#/ui/theme/themes/theme-dark/functions/rgba'

// ThreeD Garden components base styles for @mui material components
import sidenav from '#/ui/theme/themes/theme-dark/components/sidenav'
import list from '#/ui/theme/themes/theme-dark/components/list'
import listItem from '#/ui/theme/themes/theme-dark/components/list/listItem'
import listItemText from '#/ui/theme/themes/theme-dark/components/list/listItemText'
import card from '#/ui/theme/themes/theme-dark/components/card'
import cardMedia from '#/ui/theme/themes/theme-dark/components/card/cardMedia'
import cardContent from '#/ui/theme/themes/theme-dark/components/card/cardContent'
import button from '#/ui/theme/themes/theme-dark/components/button'
import iconButton from '#/ui/theme/themes/theme-dark/components/iconButton'
import input from '#/ui/theme/themes/theme-dark/components/form/input'
import inputLabel from '#/ui/theme/themes/theme-dark/components/form/inputLabel'
import inputOutlined from '#/ui/theme/themes/theme-dark/components/form/inputOutlined'
import textField from '#/ui/theme/themes/theme-dark/components/form/textField'
import menu from '#/ui/theme/themes/theme-dark/components/menu'
import menuItem from '#/ui/theme/themes/theme-dark/components/menu/menuItem'
import switchButton from '#/ui/theme/themes/theme-dark/components/form/switchButton'
import divider from '#/ui/theme/themes/theme-dark/components/divider'
import tableContainer from '#/ui/theme/themes/theme-dark/components/table/tableContainer'
import tableHead from '#/ui/theme/themes/theme-dark/components/table/tableHead'
import tableCell from '#/ui/theme/themes/theme-dark/components/table/tableCell'
import linearProgress from '#/ui/theme/themes/theme-dark/components/linearProgress'
import breadcrumbs from '#/ui/theme/themes/theme-dark/components/breadcrumbs'
import slider from '#/ui/theme/themes/theme-dark/components/slider'
import avatar from '#/ui/theme/themes/theme-dark/components/avatar'
import tooltip from '#/ui/theme/themes/theme-dark/components/tooltip'
import appBar from '#/ui/theme/themes/theme-dark/components/appBar'
import tabs from '#/ui/theme/themes/theme-dark/components/tabs'
import tab from '#/ui/theme/themes/theme-dark/components/tabs/tab'
import stepper from '#/ui/theme/themes/theme-dark/components/stepper'
import step from '#/ui/theme/themes/theme-dark/components/stepper/step'
import stepConnector from '#/ui/theme/themes/theme-dark/components/stepper/stepConnector'
import stepLabel from '#/ui/theme/themes/theme-dark/components/stepper/stepLabel'
import stepIcon from '#/ui/theme/themes/theme-dark/components/stepper/stepIcon'
import select from '#/ui/theme/themes/theme-dark/components/form/select'
import formControlLabel from '#/ui/theme/themes/theme-dark/components/form/formControlLabel'
import formLabel from '#/ui/theme/themes/theme-dark/components/form/formLabel'
import checkbox from '#/ui/theme/themes/theme-dark/components/form/checkbox'
import radio from '#/ui/theme/themes/theme-dark/components/form/radio'
import autocomplete from '#/ui/theme/themes/theme-dark/components/form/autocomplete'
import flatpickr from '#/ui/theme/themes/theme-dark/components/flatpickr'
import container from '#/ui/theme/themes/theme-dark/components/container'
import popover from '#/ui/theme/themes/theme-dark/components/popover'
import buttonBase from '#/ui/theme/themes/theme-dark/components/buttonBase'
import icon from '#/ui/theme/themes/theme-dark/components/icon'
import svgIcon from '#/ui/theme/themes/theme-dark/components/svgIcon'
import link from '#/ui/theme/themes/theme-dark/components/link'
import dialog from '#/ui/theme/themes/theme-dark/components/dialog'
import dialogTitle from '#/ui/theme/themes/theme-dark/components/dialog/dialogTitle'
import dialogContent from '#/ui/theme/themes/theme-dark/components/dialog/dialogContent'
import dialogContentText from '#/ui/theme/themes/theme-dark/components/dialog/dialogContentText'
import dialogActions from '#/ui/theme/themes/theme-dark/components/dialog/dialogActions'

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
