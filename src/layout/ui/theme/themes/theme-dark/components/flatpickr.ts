// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'

// ThreeD Garden Helper Functions
import rgba from '#/layout/ui/theme/themes/theme-dark/functions/rgba'

const { info, white, gradients } = colors

// types
type Types = any

const flatpickr: Types = {
  '.flatpickr-day:hover, .flatpickr-day:focus, .flatpickr-day.nextMonthDay:hover, .flatpickr-day.nextMonthDay:focus': {
    background: rgba(info.main, 0.28),
    border: 'none',
  },

  '.flatpickr-day.today': {
    background: info.main,
    color: white.main,
    border: 'none',

    '&:hover, &:focus': {
      background: `${info.focus} !important`,
    },
  },

  '.flatpickr-day.selected, .flatpickr-day.selected:hover, .flatpickr-day.nextMonthDay.selected, .flatpickr-day.nextMonthDay.selected:hover, .flatpickr-day.nextMonthDay.selected:focus':
    {
      background: `${gradients.info.state} !important`,
      color: white.main,
      border: 'none',
    },

  '.flatpickr-months .flatpickr-next-month:hover svg, .flatpickr-months .flatpickr-prev-month:hover svg': {
    color: `${info.main} !important`,
    fill: `${info.main} !important`,
  },
}

export default flatpickr
