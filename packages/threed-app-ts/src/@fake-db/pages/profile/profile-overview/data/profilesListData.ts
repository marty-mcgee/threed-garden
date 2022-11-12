// Images
import kal from '~/assets/images/people/kal-visuals-square.jpg'
import marie from '~/assets/images/people/marie.jpg'
import ivana from '~/assets/images/people/ivana-square.jpg'
import team3 from '~/assets/images/people/team-3.jpg'
import team4 from '~/assets/images/people/team-4.jpg'

// types
type Types = any

const profileListData: Types = [
  {
    image: kal,
    name: 'Kal Sedgewick',
    description: 'Hi! I need more components..',
    action: {
      type: 'internal',
      route: '/profile/profile-overview',
      color: 'info',
      label: 'reply',
    },
  },
  {
    image: marie,
    name: 'Anne Marie',
    description: 'Awesome work! Can you..',
    action: {
      type: 'internal',
      route: '/profile/profile-overview',
      color: 'info',
      label: 'reply',
    },
  },
  {
    image: ivana,
    name: 'Ryan Givens',
    description: 'About files I can..',
    action: {
      type: 'internal',
      route: '/profile/profile-overview',
      color: 'info',
      label: 'reply',
    },
  },
  {
    image: team4,
    name: 'Vic Peterson',
    description: 'Have a great afternoon..',
    action: {
      type: 'internal',
      route: '/profile/profile-overview',
      color: 'info',
      label: 'reply',
    },
  },
  {
    image: team3,
    name: 'Jen Daniels',
    description: 'Hiya, I need more information..',
    action: {
      type: 'internal',
      route: '/profile/profile-overview',
      color: 'info',
      label: 'reply',
    },
  },
]

export default profileListData
