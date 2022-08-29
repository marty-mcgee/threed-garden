// ** MUI Imports
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'

const data = {
  id: 'root',
  name: 'Parent',
  children: [
    {
      id: '1',
      name: 'Child - 1'
    },
    {
      id: '3',
      name: 'Child - 3',
      children: [
        {
          id: '4',
          name: 'Child - 4'
        }
      ]
    }
  ]
}

const TreeViewRichObject = ({ direction }) => {
  const renderTree = nodes => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
      {Array.isArray(nodes.children) ? nodes.children.map(node => renderTree(node)) : null}
    </TreeItem>
  )
  const ExpandIcon = direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />

  return (
    <TreeView
      sx={{ minHeight: 240 }}
      defaultExpanded={['root']}
      defaultExpandIcon={ExpandIcon}
      defaultCollapseIcon={<ChevronDown />}
    >
      {renderTree(data)}
    </TreeView>
  )
}

export default TreeViewRichObject
