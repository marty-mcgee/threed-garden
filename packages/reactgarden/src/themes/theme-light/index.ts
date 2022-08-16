// @mui material components
import { createTheme } from "@mui/material"

// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-light/base/colors"
import breakpoints from "~/themes/theme-light/base/breakpoints"
import typography from "~/themes/theme-light/base/typography"
import boxShadows from "~/themes/theme-light/base/boxShadows"
import borders from "~/themes/theme-light/base/borders"
import globals from "~/themes/theme-light/base/globals"

// Company Juice Dashboard Helper Functions
import boxShadow from "~/themes/theme-light/functions/boxShadow"
import hexToRgb from "~/themes/theme-light/functions/hexToRgb"
import linearGradient from "~/themes/theme-light/functions/linearGradient"
import pxToRem from "~/themes/theme-light/functions/pxToRem"
import rgba from "~/themes/theme-light/functions/rgba"

// Company Juice Dashboard components base styles for @mui material components
import sidenav from "~/themes/theme-light/components/sidenav"
import list from "~/themes/theme-light/components/list"
import listItem from "~/themes/theme-light/components/list/listItem"
import listItemText from "~/themes/theme-light/components/list/listItemText"
import card from "~/themes/theme-light/components/card"
import cardMedia from "~/themes/theme-light/components/card/cardMedia"
import cardContent from "~/themes/theme-light/components/card/cardContent"
import button from "~/themes/theme-light/components/button"
import iconButton from "~/themes/theme-light/components/iconButton"
import input from "~/themes/theme-light/components/form/input"
import inputLabel from "~/themes/theme-light/components/form/inputLabel"
import inputOutlined from "~/themes/theme-light/components/form/inputOutlined"
import textField from "~/themes/theme-light/components/form/textField"
import menu from "~/themes/theme-light/components/menu"
import menuItem from "~/themes/theme-light/components/menu/menuItem"
import switchButton from "~/themes/theme-light/components/form/switchButton"
import divider from "~/themes/theme-light/components/divider"
import tableContainer from "~/themes/theme-light/components/table/tableContainer"
import tableHead from "~/themes/theme-light/components/table/tableHead"
import tableCell from "~/themes/theme-light/components/table/tableCell"
import linearProgress from "~/themes/theme-light/components/linearProgress"
import breadcrumbs from "~/themes/theme-light/components/breadcrumbs"
import slider from "~/themes/theme-light/components/slider"
import avatar from "~/themes/theme-light/components/avatar"
import tooltip from "~/themes/theme-light/components/tooltip"
import appBar from "~/themes/theme-light/components/appBar"
import tabs from "~/themes/theme-light/components/tabs"
import tab from "~/themes/theme-light/components/tabs/tab"
import stepper from "~/themes/theme-light/components/stepper"
import step from "~/themes/theme-light/components/stepper/step"
import stepConnector from "~/themes/theme-light/components/stepper/stepConnector"
import stepLabel from "~/themes/theme-light/components/stepper/stepLabel"
import stepIcon from "~/themes/theme-light/components/stepper/stepIcon"
import select from "~/themes/theme-light/components/form/select"
import formControlLabel from "~/themes/theme-light/components/form/formControlLabel"
import formLabel from "~/themes/theme-light/components/form/formLabel"
import checkbox from "~/themes/theme-light/components/form/checkbox"
import radio from "~/themes/theme-light/components/form/radio"
import autocomplete from "~/themes/theme-light/components/form/autocomplete"
import flatpickr from "~/themes/theme-light/components/flatpickr"
import container from "~/themes/theme-light/components/container"
import popover from "~/themes/theme-light/components/popover"
import buttonBase from "~/themes/theme-light/components/buttonBase"
import icon from "~/themes/theme-light/components/icon"
import svgIcon from "~/themes/theme-light/components/svgIcon"
import link from "~/themes/theme-light/components/link"
import dialog from "~/themes/theme-light/components/dialog"
import dialogTitle from "~/themes/theme-light/components/dialog/dialogTitle"
import dialogContent from "~/themes/theme-light/components/dialog/dialogContent"
import dialogContentText from "~/themes/theme-light/components/dialog/dialogContentText"
import dialogActions from "~/themes/theme-light/components/dialog/dialogActions"

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
