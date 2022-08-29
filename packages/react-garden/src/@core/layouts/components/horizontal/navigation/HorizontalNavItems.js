// ** Custom Navigation Components
import HorizontalNavLink from './HorizontalNavLink'
import HorizontalNavGroup from './HorizontalNavGroup'

const resolveComponent = item => {
  if (item.children) return HorizontalNavGroup

  return HorizontalNavLink
}

const HorizontalNavItems = props => {
  const RenderMenuItems = props.horizontalNavItems?.map((item, index) => {
    const TagName = resolveComponent(item)

    return <TagName {...props} key={index} item={item} />
  })

  return <>{RenderMenuItems}</>
}

export default HorizontalNavItems
