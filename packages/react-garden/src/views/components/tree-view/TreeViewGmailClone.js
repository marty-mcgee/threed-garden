// ** MUI Imports
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
