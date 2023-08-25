/**
  All app routes are added here.
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav.
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that contains other routes
     inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  11. The `component` key is used to store the component of its route.
*/

// layouts
// import About from "~/pages/about"
import Analytics from '#/pages/dashboards/analytics'
import Sales from '#/pages/dashboards/sales'
import ProfileOverview from '#/pages/profile/profile-overview'
import AllProjects from '#/pages/profile/all-projects'
import NewUser from '#/pages/users/new-user'
import Settings from '#/app/account/settings/page'
import Billing from '#/app/account/billing/page'
import Invoice from '#/app/account/invoice/page'
import Timeline from '#/pages/projects/timeline'
import Pricing from '#/pages/pricing'
import Widgets from '#/pages/widgets'
import Charts from '#/pages/charts'
import Notifications from '#/pages/notifications'
import Kanban from '#/page/modules/kanban/page'
import Wizard from '#/page/modules/wizard/page'
import DataTables from '#/page/modules/data-tables/page'
import Calendar from '#/page/modules/calendar/page'
import NewProduct from '#/pages/dashboards/ecommerce/products/new-product'
import EditProduct from '#/pages/dashboards/ecommerce/products/edit-product'
import ProductPage from '#/pages/dashboards/ecommerce/products/product-page'
import OrderList from '#/pages/dashboards/ecommerce/orders/order-list'
import OrderDetails from '#/pages/dashboards/ecommerce/orders/order-details'
import SignInBasic from '#/pages/authentication/sign-in/basic'
import SignInCover from '#/pages/authentication/sign-in/cover'
import SignInIllustration from '#/pages/authentication/sign-in/illustration'
import SignUpCover from '#/pages/authentication/sign-up/cover'
import ResetCover from '#/pages/authentication/reset-password/cover'

// ThreeD Garden components

// @mui icons
import Icon from '@mui/material/Icon'
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork'
import BadgeIcon from '@mui/icons-material/Badge'

// Images

const routes = [
  // {
  //   type: "collapse",
  //   name: "Garden Master",
  //   key: "juice-master",
  //   icon: <MDAvatar src={profilePicture.src} alt="Garden Master" size="xs" />,
  //   collapse: [
  //     {
  //       name: "My Profile",
  //       key: "my-profile",
  //       route: "/profile/profile-overview",
  //       component: <ProfileOverview />,
  //     },
  //     {
  //       name: "Settings",
  //       key: "profile-settings",
  //       route: "/account/settings",
  //       component: <Settings />,
  //     },
  //     {
  //       name: "Logout",
  //       key: "logout",
  //       route: "/authentication/sign-in/basic",
  //       component: <SignInBasic />,
  //     },
  //   ],
  // },
  // { type: "divider", key: "divider-threed" },
  // { type: "title", title: "ThreeD Garden", key: "title-threed" },
  // {
  //   type: "collapse",
  //   noCollapse: true,
  //   name: "Home",
  //   key: "home",
  //   route: "/",
  //   // component: <Home />,
  //   icon: <Icon fontSize="medium">home</Icon>,
  // },
  {
    type: 'collapse',
    noCollapse: true,
    name: 'About',
    key: 'about',
    route: '/about',
    // component: <About />,
    icon: <AddHomeWorkIcon fontSize='medium' />,
  },
  {
    type: 'collapse',
    noCollapse: true,
    name: 'Participate',
    key: 'participate',
    route: '/participate',
    // component: <Participate />,
    icon: <Icon fontSize='medium'>agriculture</Icon>,
  },

  { type: 'divider', key: 'divider-dashboards' },
  {
    type: 'collapse',
    name: 'Adventures',
    key: 'dashboards',
    icon: <Icon fontSize='medium'>dashboard</Icon>,
    collapse: [
      {
        name: 'Analytics',
        key: 'analytics',
        route: '/dashboards/analytics',
        component: <Analytics />,
      },
      {
        name: 'Sales',
        key: 'sales',
        route: '/dashboards/sales',
        component: <Sales />,
      },
    ],
  },

  { type: 'divider', key: 'divider-pages' },
  // { type: "title", title: "Pages", key: "title-pages" },
  {
    type: 'collapse',
    name: 'Pages',
    key: 'pages',
    icon: <Icon fontSize='medium'>pages</Icon>,
    collapse: [
      {
        name: 'Profile',
        key: 'profile',
        collapse: [
          {
            name: 'Profile Overview',
            key: 'profile-overview',
            route: '/profile/profile-overview',
            component: <ProfileOverview />,
          },
          {
            name: 'All Projects',
            key: 'all-projects',
            route: '/profile/all-projects',
            component: <AllProjects />,
          },
        ],
      },
      {
        name: 'Users',
        key: 'users',
        collapse: [
          {
            name: 'New User',
            key: 'new-user',
            route: '/users/new-user',
            component: <NewUser />,
          },
        ],
      },
      {
        name: 'Account',
        key: 'account',
        collapse: [
          {
            name: 'Settings',
            key: 'settings',
            route: '/account/settings',
            component: <Settings />,
          },
          {
            name: 'Billing',
            key: 'billing',
            route: '/account/billing',
            component: <Billing />,
          },
          {
            name: 'Invoice',
            key: 'invoice',
            route: '/account/invoice',
            component: <Invoice />,
          },
        ],
      },
      {
        name: 'Projects',
        key: 'projects',
        collapse: [
          {
            name: 'Timeline',
            key: 'timeline',
            route: '/projects/timeline',
            component: <Timeline />,
          },
        ],
      },
      {
        name: 'Pricing',
        key: 'pricing',
        route: '/pricing',
        component: <Pricing />,
      },
      // {
      //   name: "RTL",
      //   key: "rtl",
      //   route: "/rtl",
      //   component: <RTL />
      // },
      {
        name: 'Widgets',
        key: 'widgets',
        route: '/widgets',
        component: <Widgets />,
      },
      {
        name: 'Charts',
        key: 'charts',
        route: '/charts',
        component: <Charts />,
      },
      {
        name: 'Notfications',
        key: 'notifications',
        route: '/notifications',
        component: <Notifications />,
      },
    ],
  },
  {
    type: 'collapse',
    name: 'Applications',
    key: 'applications',
    icon: <Icon fontSize='medium'>apps</Icon>,
    collapse: [
      {
        name: 'Kanban',
        key: 'kanban',
        route: '/modules/kanban',
        component: <Kanban />,
      },
      {
        name: 'Wizard',
        key: 'wizard',
        route: '/modules/wizard',
        component: <Wizard />,
      },
      {
        name: 'Data Tables',
        key: 'data-tables',
        route: '/modules/data-tables',
        component: <DataTables />,
      },
      {
        name: 'Calendar',
        key: 'calendar',
        route: '/modules/calendar',
        component: <Calendar />,
      },
    ],
  },
  {
    type: 'collapse',
    name: 'Ecommerce',
    key: 'ecommerce',
    icon: <Icon fontSize='medium'>shopping_basket</Icon>,
    collapse: [
      {
        name: 'Products',
        key: 'products',
        collapse: [
          {
            name: 'New Product',
            key: 'new-product',
            route: '/ecommerce/products/new-product',
            component: <NewProduct />,
          },
          {
            name: 'Edit Product',
            key: 'edit-product',
            route: '/ecommerce/products/edit-product',
            component: <EditProduct />,
          },
          {
            name: 'Product Page',
            key: 'product-page',
            route: '/ecommerce/products/product-page',
            component: <ProductPage />,
          },
        ],
      },
      {
        name: 'Orders',
        key: 'orders',
        collapse: [
          {
            name: 'Order List',
            key: 'order-list',
            route: '/ecommerce/orders/order-list',
            component: <OrderList />,
          },
          {
            name: 'Order Details',
            key: 'order-details',
            route: '/ecommerce/orders/order-details',
            component: <OrderDetails />,
          },
        ],
      },
    ],
  },
  {
    type: 'collapse',
    name: 'Authentication',
    key: 'authentication',
    icon: <BadgeIcon fontSize='medium' />,
    collapse: [
      {
        name: 'Sign In',
        key: 'sign-in',
        collapse: [
          {
            name: 'Basic',
            key: 'basic',
            route: '/authentication/sign-in/basic',
            component: <SignInBasic />,
          },
          {
            name: 'Cover',
            key: 'cover',
            route: '/authentication/sign-in/cover',
            component: <SignInCover />,
          },
          {
            name: 'Illustration',
            key: 'illustration',
            route: '/authentication/sign-in/illustration',
            component: <SignInIllustration />,
          },
        ],
      },
      {
        name: 'Sign Up',
        key: 'sign-up',
        collapse: [
          {
            name: 'Cover',
            key: 'cover',
            route: '/authentication/sign-up/cover',
            component: <SignUpCover />,
          },
        ],
      },
      {
        name: 'Reset Password',
        key: 'reset-password',
        collapse: [
          {
            name: 'Cover',
            key: 'cover',
            route: '/authentication/reset-password/cover',
            component: <ResetCover />,
          },
        ],
      },
    ],
  },

  { type: 'divider', key: 'divider-docs' },
  // { type: "title", title: "Docs", key: "title-docs" },
  {
    type: 'collapse',
    name: 'Docs',
    key: 'docs',
    icon: <Icon fontSize='medium'>upcoming</Icon>,
    collapse: [
      {
        name: 'Getting Started',
        key: 'getting-started',
        collapse: [
          {
            name: 'Overview',
            key: 'overview',
            href: '#react/overview/material-dashboard/',
          },
          {
            name: 'License',
            key: 'license',
            href: '#react/license/material-dashboard/',
          },
          {
            name: 'Quick Start',
            key: 'quick-start',
            href: '#react/quick-start/material-dashboard/',
          },
          {
            name: 'Build Tools',
            key: 'build-tools',
            href: '#react/build-tools/material-dashboard/',
          },
        ],
      },
      {
        name: 'Foundation',
        key: 'foundation',
        collapse: [
          {
            name: 'Functions',
            key: 'functions',
            href: '#react/functions/material-dashboard/',
          },
          {
            name: 'Routing System',
            key: 'routing-system',
            href: '#react/routing-system/material-dashboard/',
          },
        ],
      },
    ],
  },
  {
    type: 'collapse',
    name: 'View Code',
    key: 'codebase',
    href: 'https://github.com/marty-mcgee/threed-garden/',
    icon: <Icon fontSize='medium'>receipt_long</Icon>,
    noCollapse: true,
  },
]

export default routes
