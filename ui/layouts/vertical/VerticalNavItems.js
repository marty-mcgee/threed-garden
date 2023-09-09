// ** Custom Menu Components
import VerticalNavLink from './VerticalNavLink'
import VerticalNavGroup from './VerticalNavGroup'
import VerticalNavSectionTitle from './VerticalNavSectionTitle'

const resolveNavItemComponent = (item) => {
  // console.debug('HEY HEY HEY item', item)
  if (item.sectionTitle) return VerticalNavSectionTitle
  if (item.children) return VerticalNavGroup

  return VerticalNavLink
}

const VerticalNavItems = (props) => {
  // ** Props
  const { verticalNavItems } = props
  // console.debug('HEY HEY HEY verticalNavItems', verticalNavItems)

  const RenderMenuItems = verticalNavItems?.map((item, index) => {
    const TagName = resolveNavItemComponent(item)

    return (
      <TagName
        {...props}
        key={index}
        item={item}
      />
    )
  })

  return <>{RenderMenuItems}</>
}

export default VerticalNavItems
