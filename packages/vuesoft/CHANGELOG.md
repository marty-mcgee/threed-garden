# Change Log

## [2.0.0] 2022-03-28

### Bug fixing

### Major style changes

- Removed `Icon` component.
- VsudAlert `icon` prop updated with empty default value.
- VsudAvatar `img` prop updated with `required: true` attribute.
- VsudAvatar `alt`, `size`, `shadow`, `borderRadius` props updated with empty default values.
- VsudInput `isValid` prop removed and added `success` and `error` props instead.
- VsudInput `placeholder` prop set with default value of `Type here...` .
- VsudInput `type` prop set with default value of `text`.
- VsudInput `isRequired` prop updated with default value of `false`.
- VsudInput `iconDir` prop default value set to `left`.
- VsudPagination `color` set to default value of `success`.
- VsudPagination `size`set to default value of `md`.
- VsudButton `color` prop updated from `info` to `success` color.
- VsudCheckbox `checked` prop updated from `string` to `boolean`.
- VsudProgress `color` prop updated from `primary` to `success`.
- VsudProgress `percentage` prop is now `required` and updated from `string` to `Number`.
- VsudRadio `name`, and `id` props are now set to `required.`
- VsudRadio `checked` prop type changed from `string` to `boolean` and default value set to `false`.
- VsudSnackbar `title` prop value is set to `required`.
- VsudSnackbar `icon` prop type updated to accept `String` and `Object` with `component` and `color` keys.
- VsudSocialBtn `icon` prop value is set to `required` now.
- VsudSocialBtn `iconOnly` prop type changed from `string` to `boolean` and is set to `required`.
- VsudSocialBtn `socialBtn` prop value is set to `required` now.
- VsudSwitch `name`, and `id` prop values are `required` now.
- VsudSwitch `checked` prop type `changed` from `string` to `boolean`.
- VsudSwitch `inputClass` prop removed and can directly be accessed using `class`.
- VsudTextArea `id` prop is set to `required` now.
- VsudTextArea `placeholder` prop has now a default text.
- Renamed `Card` component to `MiniStatisticsCard`.
- MiniStatisticsCard `title` prop accepts `String` and `Object` with `text` and `color` keys.
- MiniStatisticsCard `value` prop accepts `Number`, `String`, and `Object` with `text`, and `color` keys.
- MiniStatisticsCard `percentage` prop accepts `String` and `Object` with `value` and `color` keys. The default `color` is set to `text-success`.
- MiniStatisticsCard `icon` prop accepts `String` and `Object` with `component` and `background` keys. The default `background` color is set to `bg-white`.
- MiniStatisticsCard `classContent` prop accepts a `string` to apply custom class around the content.
- ComplexStatisticsCard `prop` names and types updated.
- ComplexStatisticsCard `icon` prop accepts `String` and `Object` with `component` and `background` keys. The `icon` prop value is `required`.
- ComplexStatisticsCard `count` prop accepts an `Object` with `number` and `label` keys.
- ComplexStatisticsCard `percentage` prop accepts `String` and `Object` with `label` and `color` keys.
- ComplexStatisticsCard `backgroundColor` prop accepts a `String` with default value set to `dark`.
- DefaultInfoCard `classIcon` prop is renamed to `icon`.
- DefaultInfoCard `icon` prop can accept a `String` or `Object` with `component` and `background` keys.
- DefaultInfoCard `title` prop’s value is set to `required`.
- DefaultInfoCard `price` prop is renamed to `value` with the acceptable types of `String`, and `Number`.
- MasterCard `props` refactored to a single `card` prop `Object` with the following keys:

  - `number` accepts a `String` with the default value of `7852 4594 1122 4562`.
  - `holderText` accepts a `String` with the default value of `Card Holder`.
  - `holderName` accepts a `String` with the default value of `Jack Peterson`.
  - `expiryText` accepts a `String` with the default value of `Expirs`.
  - `expiryDate` accepts a `String` with the default value of `11/22`.
  - `background` accepts a `String` with the default value of `dark`.

- SwitchCard `props` refactored to a single `required` prop named `item` with `Object` data type with the following keys:
  - `state` accepts a `String`.
  - `label` accepts a `String`.
  - `description` accepts a `String`.
  - `isChecked` accepts a `Boolean`.
  - `classCustom` accepts a `String`.
- Renamed `TempCard` component to `DefaultCounterCard`.
- DefaultCounterCard `status` prop renamed to `required` prop `count` and accepts `String` and `Number` values.
- DefaultCounterCard `title` prop accepts a `String` and is a `required` value.
- Added `prefix` prop to `DefaultCounterCard`.
- Added `color` prop for `count` prop with default value of `success` to `DefaultCounterCard`.
- Renamed `ConsumptionRoomChart` to `ReportsDoughnutChart`.
- Added `id`, `height`, `title`, `description` and `chart` props to `GradientLineChart`. The `chart` has `Object` data type with the following keys:
  - `labels` has `Array` data type.
  - `datasets` has `Array` data type with the following keys:
    - `label` has `String` data type.
    - `data` has `Array` data type.
- Renamed `ConsumptionDayChart` to `ThinBarChart`.
- Added `id`, `title`, `height` and `chart` props to `ThinBarchart`. The `chart` has `Object` data type with the following keys:
  - `labels` has `Array` data type.
  - `datasets` has `Object` data type with the following keys:
    - `label` has `String` data type.
    - `data` has `Array` data type.
- Renamed `ActiveUsersChart` component to `ReportsBarChart`.
- Added Added `id`, `color`, `title`, `description`, `chart`, and `items` props to `ReportsBarChart`. The `items` prop has `Array` data type and the `chart` has `Object` data type with the following keys:
  - `labels` has `Array` data type.
  - `datasets` has `Object` data type with the following keys:
    - `label` has `String` data type.
    - `data` has `Array` data type.
- Added `id`, `day`, `year`, `initialView`, `initialDate`, `events`, `selectable`, and `editable` props to `Calendar` component.
- Renamed `BirthdayMessageCard` to `MessageCard`.
- Added `image`, `message`, and `action` props to `MessageCard`. The `image` prop accepts `String`, and `Object` and the `url` and `alt` keys. The `action` prop is also an `Object` with the `color`, `route`, and `label` keys.
- `CategoriesCard` renamed to `CategoriesList` and `prop` structure updated for dynamic content addition. Added `items` prop type of `Array` with `icon` prop type of `Object` with `component` and `background` keys, `title`, and `description` keys.
- Deleted `VisitorsCard` and `IncomeCard` components and added new `MiniGradientLineChart` component instead.
- Added `id`, `height`, `title`, `description`, and `chart` props. The `chart` has `Object` data type with the following keys:
  - `labels` has `Array` data type.
  - `datasets` has `Array`data type with the following keys:
    - `label` has `String` data type.
    - `data` has `Array` data type.
- Deleted `TransactionsCard` and `RevenueCard` components and added new `RankingList` and `RankingListCard` component instead.
- Added `card` object prop with `title`, `subtitle`, `date` keys to `RankingListCard` component.
- Added boolean `HorizontalBreak` and array `item` props with `title`, `date`, `amount`, `icon`, `color` keys to `RankingListCard` component.
- Renamed `WealthCreationCard` component to `BackgroundBlogCard` component.
- Added `color`, `image`, `title`, `description` and `action` props. The `action` prop is an Object and has the `route` and `label` keys.
- Renamed `NewTabCard` to `PlaceHolderCard`.
- Added `icon`, and `title` prop type of object with `variant` and `text` keys to PlaceholderCard.
- Renamed `CardPlayer` component to `MiniPlayerCard`component.
- Renamed `CardCalendar` component to `CalendarCard` component and added `items` prop type of array with `time` and `description` keys.
- Renamed `CardEmail` to `EmailCard` component and Added `route`, `text`, `tooltip` props.
- Renamed `CardMessage` component to `MessageCard` component.
- Added `title`, and `messages` prop type of array with the `route`, `tooltip`, and `images` keys to `MessageCard`.
- Renamed `CardPlayer` component to `PlayerCard` component.
- Added `color` and `song` prop type of object with `title` and `singer` keys to `Playercard`.
- Renamed `CardToDo` component to `TodoCard` component.
- Added `todos` prop to `TodoCard` component.
- Added `pages` array prop type with `url`, `views`, `time`, and `rate` keys to PagesCard component.
- Renamed `TrafficChart` to `DefaultLineChart` component.
- Added `id`, `title`, and `chart` props to the DefaultLineChart component. The `chart` prop is an object with the following keys: `labels`, and `datasets`. The `datasets` is an array with the following keys: `label` and `data`.
- Renamed `RefferalsChart` component to `DefaultDoughnutChart` component.
- Added `id`, `height`, and `chart` object props with the following keys: `labels` and `datasets`. The `datasets` is an array with the following keys: `label` and `data`.
- Renamed `RefferalsCard` to `DefaultDoughnutChart`.
- Added `id`, `height`, `title`, `chart`, and `actions` props to DefaultDoughnutChart. The `chart` prop is an object with the following keys: `labels`, and `datasets`. The `actions` prop is also an object with the following keys: `route`, `label`, `color`.
- Added `title`, `tooltip`, and array `items` props to SocialCard.
- Delete `CalendarTable`.
- Deleted `ProductivityChart` component and added `MiniLineChart` with `id`, `height`, and object `chart` prop component.
- Added array `events` prop to `EventsCard` component.
- Renamed `OverviewCard` to `DefaultStatisticsCard`.
- Added `title`, `count`, `menu`, `percentage`, and `dropdown` props to DefaultStatisticsCard. The `percentage` props is an object with the following keys: `color`, `value`, and `label`. The `dropdown` is an array props with the following keys: `label`, and `route`.
- Added `PieChart` component with `id`, `height`, `title`, and object `chart` props.
- Extracted `SalesChartCard` component to `HorizontalBarChart` component and added `id`, `height`, and object `chart` data type props with the following keys: `labels`, and `datasets`.
- Add `ComplexBackgroundCard` component with the following props: `image`, `description`, and `action`.
- Add `TransparentInfoCard` component with the following props: `icon`, `description`, and `value`.
- Added `OutlinedCounterCard` component with the following props: `duration`, `title`, `count`, `prefix`, and `suffix`.
- Deleted `ProductsCard` and `UserCard` component.
- Added `OrdersListCard` component with the following props: `title`, `headers` and `products`.
- Renamed `ProjectOverviewCard` component to `DefaultProjectCard` component and added the following props: `image`, `label`, `title`, `description`, `action`, and `authors` props.
- Renamed `ProjectsCard` component to `ComplexProjectCard` component and added the following `string` props: `image`, `title`, `description`, `dateTime` and `members`, and `dropdown` array props.
- Renamed `MarketingCard` component to `TeamProfileCard` component and added the following props: `title`, `description`, `industry`, `rating`, `members`, and `dropdown`.
- Renamed `StoryAvatar`'s `img` prop to `image`.
- Renamed `ProfileCard` component to `ProfileInfoCard` and added the following props: `title`, `description`, `info`, `social`, and `action`.
- Renamed and refactored `MeetCard` component to `EventCard` and added the following props: `id`, `image`, `title`, `description`, `dateTime`, `action`, and `members`.
- Deleted `TransactionCard` component.
- Added `SalesTable` component with the following props: `title`, and `rows`.
- Renamed `PaymentCard` component to `PaymentMethodsCard` component.
- Renamed `JobCard` component to `AnnouncementCard` component with the following props: `by`, `badge`, `title`, `description`, `value`, and `action` props.
- Deleted `ProjectsCard` component and added `ProgressDoughnutChart` component instead with the following props: `id`, `title`, `icon`, `count`, and `chart`.
- Deleted `TasksCard` component and added `ProgressLineChart` instead with the following props: `id`, `height`, `icon`, `title`, `count`, `progress`, and `chart`.
- Added `action` prop with the following keys: `route`, `label` to `TodoItem` component.
- Deleted `TimelineCard` component and added `TimelineList` and `TimelineItem` components.
- Added `title`, `description` and `darkMode` props to TimelineList component.
- Added `color`, `icon`, `title`, `dateTime`, `description`, `badges`, and `darkMode` props to TimelineItem component.
- Refactored `PricingCard` component with the following props: `badge`, `price`, `specifications`, and `action` props.
- Added `Accordion` component with the following props: `title`, and `description`.
- Deleted `CaloriesChart` component.
- Renamed `IncomeChart` component to `LineChart` component.
- Added `id`, `height`, `title`, `value` and `chart` props to `LineChart`component.
- Added `count`, and `badge` object props to StepsCard component.
- Deleted `OrdersCard` Component.
- Deleted `EventsCard` component and added `DefaultItem` with the following props instead: `icon`, `title`, and `description`.
- Added `id`, `height`, and `chart` props to BarChart component.
- Added `id`, `height`, and `chart` props to BarChartHorizontal component.
- Added `id`, `height`, and `chart` props to MixedChart component.
- Added `id`, `height`, and `chart` props to BubbleChart component.
- Added `id`, `height`, and `chart props to` DoughnutChart component.
- Added `id`, `height`, and `chart props to` RadarChart component.
- Added `id`, `height`, and `chart props to` PolarChart component.
- Renamed `FullBodyCard` component to `InfoCard` component and updated it with the following props: `title`, `badge`, and `description`.
- Added `title`, `description`, `reviews` and `action props to` ReviewCard component.

### Deleted components

```
@/components/Icon.vue
```

### Added components

```
@/components/Icon/Air.vue
@/components/Icon/Basket.vue
@/components/Icon/Box3d.vue
@/components/Icon/CreditCard.vue
@/components/Icon/CustomerSupport.vue
@/components/Icon/Document.vue
@/components/Icon/GettingStarted.vue
@/components/Icon/Humidity.vue
@/components/Icon/Lights.vue
@/components/Icon/Office.vue
@/components/Icon/Settings.vue
@/components/Icon/Shop.vue
@/components/Icon/Spaceship.vue
@/components/Icon/Switches.vue
@/components/Icon/Temperature.vue
@/components/Icon/Wifi.vue
```

### Deleted dependencies

```
@fullcalendar/vue
@fullcalendar/vue3
countup.js
```

### Added dependencies

```
vue-count-to
vue-star-rating
@fortawesome
```

### Updated dependencies

### Warning

## [1.0.0] 2022-01-24

### Initial Release
