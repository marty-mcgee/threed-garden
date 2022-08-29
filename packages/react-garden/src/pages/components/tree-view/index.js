// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Hooks Imports
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Demo Components Imports
import TreeViewBasic from 'src/views/components/tree-view/TreeViewBasic'
import TreeViewControlled from 'src/views/components/tree-view/TreeViewControlled'
import TreeViewRichObject from 'src/views/components/tree-view/TreeViewRichObject'
import TreeViewCustomized from 'src/views/components/tree-view/TreeViewCustomized'
import TreeViewGmailClone from 'src/views/components/tree-view/TreeViewGmailClone'
import TreeViewMultiSelection from 'src/views/components/tree-view/TreeViewMultiSelection'

// ** Source code imports
import * as source from 'src/views/components/tree-view/TreeViewSourceCode'

const TreeView = () => {
  // ** Hooks
  const { settings } = useSettings()

  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Basic Tree View'
          code={{
            tsx: null,
            jsx: source.TreeViewBasicJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>TreeView</code> & <code>TreeItem</code> components and <code>defaultCollapseIcon</code> &{' '}
            <code>defaultExpandIcon</code> props with <code>TreeView</code> component for a simple tree view.
          </Typography>
          <TreeViewBasic direction={settings.direction} />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Multi Selection'
          code={{
            tsx: null,
            jsx: source.TreeViewMultiSelectionJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>multiSelect</code> prop for multiple selection in a tree view.
          </Typography>
          <TreeViewMultiSelection direction={settings.direction} />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Controlled Tree View'
          code={{
            tsx: null,
            jsx: source.TreeViewControlledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>expanded</code>, <code>selected</code>, <code>onNodeToggle</code> and <code>onNodeSelect</code>{' '}
            props with the help of states.
          </Typography>
          <TreeViewControlled direction={settings.direction} />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Rich Object'
          code={{
            tsx: null,
            jsx: source.TreeViewRichObjectJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            <code>TreeView</code> and <code>TreeItem</code> components can also use APIs. Use an object and recursion
            can be used to handle it.
          </Typography>
          <TreeViewRichObject direction={settings.direction} />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Tree View'
          code={{
            tsx: null,
            jsx: source.TreeViewCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your tree view.
          </Typography>
          <TreeViewCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Gmail Clone'
          code={{
            tsx: null,
            jsx: source.TreeViewGmailCloneJSXCode
          }}
        >
          <TreeViewGmailClone direction={settings.direction} />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default TreeView
