export const TreeViewBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'

const TreeViewBasic = ({ direction }) => {
  const ExpandIcon = direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />

  return (
    <TreeView sx={{ minHeight: 240 }} defaultCollapseIcon={<ChevronDown />} defaultExpandIcon={ExpandIcon}>
      <TreeItem nodeId='1' label='Applications'>
        <TreeItem nodeId='2' label='Calendar' />
        <TreeItem nodeId='3' label='Chrome' />
        <TreeItem nodeId='4' label='Webstorm' />
      </TreeItem>
      <TreeItem nodeId='5' label='Documents'>
        <TreeItem nodeId='10' label='OSS' />
        <TreeItem nodeId='6' label='MUI'>
          <TreeItem nodeId='7' label='src'>
            <TreeItem nodeId='8' label='index.js' />
            <TreeItem nodeId='9' label='tree-view.js' />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </TreeView>
  )
}

export default TreeViewBasic
`}</code>
  </pre>
)

export const TreeViewControlledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'

const TreeViewControlled = ({ direction }) => {
  // ** States
  const [expanded, setExpanded] = useState([])
  const [selected, setSelected] = useState([])

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds)
  }

  const handleSelect = (event, nodeIds) => {
    setSelected(nodeIds)
  }
  const ExpandIcon = direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />

  return (
    <TreeView
      expanded={expanded}
      selected={selected}
      sx={{ minHeight: 240 }}
      onNodeToggle={handleToggle}
      onNodeSelect={handleSelect}
      defaultExpandIcon={ExpandIcon}
      defaultCollapseIcon={<ChevronDown />}
    >
      <TreeItem nodeId='1' label='Applications'>
        <TreeItem nodeId='2' label='Calendar' />
        <TreeItem nodeId='3' label='Chrome' />
        <TreeItem nodeId='4' label='Webstorm' />
      </TreeItem>
      <TreeItem nodeId='5' label='Documents'>
        <TreeItem nodeId='10' label='OSS' />
        <TreeItem nodeId='6' label='MUI'>
          <TreeItem nodeId='7' label='src'>
            <TreeItem nodeId='8' label='index.js' />
            <TreeItem nodeId='9' label='tree-view.js' />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </TreeView>
  )
}

export default TreeViewControlled
`}</code>
  </pre>
)

export const TreeViewGmailCloneJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import TreeView from '@mui/lab/TreeView'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import TreeItem from '@mui/lab/TreeItem'

// ** Icons Imports
import TagOutline from 'mdi-material-ui/TagOutline'
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'
import LabelOutline from 'mdi-material-ui/LabelOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ForumOutline from 'mdi-material-ui/ForumOutline'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'
import InformationOutline from 'mdi-material-ui/InformationOutline'
import AccountSupervisorOutline from 'mdi-material-ui/AccountSupervisorOutline'

// Styled TreeItem component
const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  '&:hover > .MuiTreeItem-content:not(.Mui-selected)': {
    backgroundColor: theme.palette.action.hover
  },
  '& .MuiTreeItem-content': {
    paddingRight: theme.spacing(3),
    borderTopRightRadius: theme.spacing(4),
    borderBottomRightRadius: theme.spacing(4),
    fontWeight: theme.typography.fontWeightMedium
  },
  '& .MuiTreeItem-label': {
    fontWeight: 'inherit',
    paddingRight: theme.spacing(3)
  },
  '& .MuiTreeItem-group': {
    marginLeft: 0,
    '& .MuiTreeItem-content': {
      paddingLeft: theme.spacing(4),
      fontWeight: theme.typography.fontWeightRegular
    }
  }
}))

const StyledTreeItem = props => {
  // ** Props
  const { labelText, labelIcon: LabelIcon, labelInfo, ...other } = props

  return (
    <StyledTreeItemRoot
      {...other}
      label={
        <Box sx={{ py: 1, display: 'flex', alignItems: 'center' }}>
          <LabelIcon color='inherit' sx={{ mr: 1 }} />
          <Typography variant='body2' sx={{ flexGrow: 1, fontWeight: 'inherit' }}>
            {labelText}
          </Typography>
          {labelInfo ? (
            <Typography variant='caption' color='inherit'>
              {labelInfo}
            </Typography>
          ) : null}
        </Box>
      }
    />
  )
}

const TreeViewGmailClone = ({ direction }) => {
  const ExpandIcon = direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />

  return (
    <TreeView
      sx={{ minHeight: 240 }}
      defaultExpanded={['3']}
      defaultExpandIcon={ExpandIcon}
      defaultCollapseIcon={<ChevronDown />}
    >
      <StyledTreeItem nodeId='1' labelText='All Mail' labelIcon={EmailOutline} />
      <StyledTreeItem nodeId='2' labelText='Trash' labelIcon={DeleteOutline} />
      <StyledTreeItem nodeId='3' labelText='Categories' labelIcon={LabelOutline}>
        <StyledTreeItem nodeId='5' labelInfo='90' labelText='Social' labelIcon={AccountSupervisorOutline} />
        <StyledTreeItem nodeId='6' labelInfo='2,294' labelText='Updates' labelIcon={InformationOutline} />
        <StyledTreeItem nodeId='7' labelInfo='3,566' labelText='Forums' labelIcon={ForumOutline} />
        <StyledTreeItem nodeId='8' labelInfo='733' labelText='Promotions' labelIcon={TagOutline} />
      </StyledTreeItem>
      <StyledTreeItem nodeId='4' labelText='History' labelIcon={LabelOutline} />
    </TreeView>
  )
}

export default TreeViewGmailClone
`}</code>
  </pre>
)

export const TreeViewCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TreeItem from '@mui/lab/TreeItem'
import { alpha, styled } from '@mui/material/styles'
import MuiTreeView from '@mui/lab/TreeView'

// ** Icons Imports
import PlusBoxOutline from 'mdi-material-ui/PlusBoxOutline'
import CloseBoxOutline from 'mdi-material-ui/CloseBoxOutline'
import MinusBoxOutline from 'mdi-material-ui/MinusBoxOutline'

// Styled TreeView component
const TreeView = styled(MuiTreeView)(({ theme }) => ({
  minHeight: 264,
  '& .MuiTreeItem-iconContainer .close': {
    opacity: 0.3
  },
  '& .MuiTreeItem-group': {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: 1px dashed {alpha(theme.palette.text.primary, 0.4)}
  }
}))

const TreeViewCustomized = () => {
  return (
    <TreeView
      defaultExpanded={['1']}
      defaultExpandIcon={<PlusBoxOutline />}
      defaultCollapseIcon={<MinusBoxOutline />}
      defaultEndIcon={<CloseBoxOutline className='close' />}
    >
      <TreeItem nodeId='1' label='Main'>
        <TreeItem nodeId='2' label='Hello' />
        <TreeItem nodeId='3' label='Subtree with children'>
          <TreeItem nodeId='6' label='Hello' />
          <TreeItem nodeId='7' label='Sub-subtree with children'>
            <TreeItem nodeId='9' label='Child 1' />
            <TreeItem nodeId='10' label='Child 2' />
            <TreeItem nodeId='11' label='Child 3' />
          </TreeItem>
          <TreeItem nodeId='8' label='Hello' />
        </TreeItem>
        <TreeItem nodeId='4' label='World' />
        <TreeItem nodeId='5' label='Something something' />
      </TreeItem>
    </TreeView>
  )
}

export default TreeViewCustomized
`}</code>
  </pre>
)

export const TreeViewMultiSelectionJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'

const TreeViewMultiSelection = ({ direction }) => {
  const ExpandIcon = direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />

  return (
    <TreeView multiSelect sx={{ minHeight: 240 }} defaultCollapseIcon={<ChevronDown />} defaultExpandIcon={ExpandIcon}>
      <TreeItem nodeId='1' label='Applications'>
        <TreeItem nodeId='2' label='Calendar' />
        <TreeItem nodeId='3' label='Chrome' />
        <TreeItem nodeId='4' label='Webstorm' />
      </TreeItem>
      <TreeItem nodeId='5' label='Documents'>
        <TreeItem nodeId='10' label='OSS' />
        <TreeItem nodeId='6' label='MUI'>
          <TreeItem nodeId='7' label='src'>
            <TreeItem nodeId='8' label='index.js' />
            <TreeItem nodeId='9' label='tree-view.js' />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </TreeView>
  )
}

export default TreeViewMultiSelection
`}</code>
  </pre>
)

export const TreeViewRichObjectJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)
