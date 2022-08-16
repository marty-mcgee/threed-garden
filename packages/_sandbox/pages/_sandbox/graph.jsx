// @flow

import React, { useState, useEffect } from 'react';
import _ from 'lodash';

import { Paper, Button, makeStyles, Grid, Tabs, Tab } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/styles';
import { Resizable } from 're-resizable';
import uniqid from 'uniqid';

import { InsertLink, Done, Clear, Link, LinkOff, LayersOutlined, LayersClearOutlined, icon, RadioButtonChecked, RadioButtonUnchecked, AddCircleOutline, Add } from '@material-ui/icons';

import { wrapPage } from '../../imports/wrap-page';
import { useGql, useMutation, toGqls, gql } from '../../imports/packages/gql/use';
import { useUrlState } from '../../imports/packages/use-url-state';
import { Graph } from '../../imports/packages/graph';
import { useParsed } from '../../imports/packages/graph/parse';
import { gqlUnwrap } from '../../imports/packages/gql/methods';

import Graphiql, { generateGraphiqlFetcher } from '../../imports/packages/graphiql';

import { defaultTheme } from '../../imports/themes/default';
import { Results } from '../../imports/sandbox/graph/results';
import { ReactJson } from '../../imports/packages/react-json';
import {
  QUERY, ADD_ROOT_NODE, ADD_CHILD_NODE, INSERT_LINK, DELETE_NODE,
} from '../../imports/sandbox/graph/gql';
import { useSnackbar } from 'notistack';

const _fetcher = generateGraphiqlFetcher({
  path: process.env.GQL_PATH,
  secret: process.env.GQL_SECRET,
});

export default wrapPage(() => {
  const { enqueueSnackbar } = useSnackbar();

  const [gql, setGql] = useState({ query: QUERY });

  const [query, setQuery] = useState(gql.query);

  const [giqlExplorerIsOpen, setGiqlExplorerIsOpen] = useState(true);

  const [layers, setLayers] = useState(false);
  const [topPanelSize, setTopPanelSizeType] = useState({ height: 200 });
  const [topPanelValue, _setTopPanelValue] = useState('gql');
  const setTopPanelValue = (value) => {
    _setTopPanelValue(topPanelValue === value ? null : value);
  };
  const [viewMode, setViewMode] = useState('3d');

  const [selected, setSelected] = useState<any>(null);
  const [linking, setLinking] = useState<any>();

  const [addRootNode] = useMutation(ADD_ROOT_NODE, {
    onCompleted: () => enqueueSnackbar('ADD_ROOT_NODE completed'),
    onError: (error) => enqueueSnackbar(`ADD_ROOT_NODE error ${error}`, { variant: 'error' }),
  });
  const [addChildNode] = useMutation(ADD_CHILD_NODE, {
    onCompleted: () => enqueueSnackbar('ADD_CHILD_NODE completed'),
    onError: (error) => enqueueSnackbar(`ADD_CHILD_NODE error ${error}`, { variant: 'error' }),
  });
  const [deleteNode] = useMutation(DELETE_NODE, {
    onCompleted: () => enqueueSnackbar('DELETE_NODE completed'),
    onError: (error) => enqueueSnackbar(`DELETE_NODE error ${error}`, { variant: 'error' }),
  });
  const [deleteLink] = useMutation(DELETE_NODE, {
    onCompleted: () => enqueueSnackbar('DELETE_LINK completed'),
    onError: (error) => enqueueSnackbar(`DELETE_LINK error ${error}`, { variant: 'error' }),
  });
  const [insertLink] = useMutation(INSERT_LINK, {
    onCompleted: () => enqueueSnackbar('INSERT_LINK completed'),
    onError: (error) => enqueueSnackbar(`INSERT_LINK error ${error}`, { variant: 'error' }),
  });

  const onNodeClick = (node) => {
    if (linking === true) {
      setLinking(node);
    } else {
      setSelected(node);
      topPanelValue !== 'selected' && setTopPanelValue('selected');
    }
  };


  const deleteSelected = () => {
    if (selected.__typename === 'nodes') {
      deleteNode({ variables: { id: selected.id } });
    } else if (selected.__typename === 'links') {
      deleteLink({ variables: { id: selected.id } });
    } else {
      enqueueSnackbar(`cant delete ${selected.__typename}`);
    }
    setSelected(null);
  };

  const addChildSelected = () => {
    addChildNode({
      variables: {
        nodeId: uniqid(),
        sourceNodeId: selected.id,
      },
    });
  };

  const makeLink = () => {
    setLinking(true);
  };
  const doneLink = () => {
    insertLink({
      variables: {
        sourceId: selected.id,
        // $flowignore
        targetId: linking.id,
        id: uniqid(),
      },
    });
    setSelected(null);
    setLinking(null);
  };
  const cancelLink = () => {
    setLinking(null);
  };

  const addRoot = () => {
    addRootNode({ variables: { nodeId: uniqid() } });
  };

  const fetcher = async (params) => {
    const result = await _fetcher(params);

    if (!result.errors) {
      if (!params.query.includes('__schema') && !params.query.includes('mutation')) {
        setGql({ query: gqlUnwrap(params.query) });
      }
    }

    return result;
  };

  return (
    <>
      <Paper
        style={{
          position: 'absolute',
          zIndex: 99,
          left: 0, top: 0,
          width: '100%',
          height: 48,
        }}
        elevation={6}
      >
        <Grid container justify="space-between" alignItems="center">
          <Grid item>
            <Grid container justify="flex-start" alignItems="center">
              <Grid item>
                <Tabs value={topPanelValue === 'gql' ? 'giql' : 'none'}>
                  <Tab value="none" label="" style={{ display: 'none' }}/>
                  <Tab value="giql" onClick={() => {
                    setTopPanelValue('gql');
                  }} label="GQL"/>
                </Tabs>
              </Grid>
              <Grid item>
                <Tabs value={layers ? 'layers' : 'none'}>
                  <Tab value="none" label="" style={{ display: 'none' }}/>
                  <Tab value="layers" onClick={() => setLayers(!layers)} icon={layers ? <LayersOutlined/> : <LayersClearOutlined/>}/>
                </Tabs>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Tabs value={topPanelValue === 'selected' ? 'selected' : 'none'}>
              <Tab value="none" label="" style={{ display: 'none' }}/>
              <Tab
                value="selected"
                onClick={() => setTopPanelValue('selected')}
                icon={selected ? `selected ${selected.id}` : 'not selected'}
              />
              <Tab disabled={!selected} value="deleteSelected" onClick={deleteSelected} icon={<Clear/>}/>
              <Tab disabled={!selected} value="addChild" onClick={addChildSelected} icon={<AddCircleOutline/>}/>
              <Tab value="add" onClick={addRoot} icon={<Add/>}/>
            </Tabs>
          </Grid>
          <Grid item>
            <Tabs value={linking ? 'makeLink' : 'none'}>
              <Tab value="none" label="" style={{ display: 'none' }}/>
              <Tab disabled={!selected} value="makeLink" onClick={makeLink} icon={linking ? linking === true ? 'linking' : `${selected.id} > ${linking.id}` : 'make link'}/>
              <Tab disabled={!selected || !linking} value="doneLink" onClick={doneLink} icon={<Done/>}/>
              <Tab disabled={!selected || !linking} value="cancelLink" onClick={cancelLink} icon={<Clear/>}/>
            </Tabs>
          </Grid>
          <Grid item>
            <Tabs value={viewMode}>
              <Tab value="3d" onClick={() => setViewMode('3d')} label="3d"/>
              <Tab value="2d" onClick={() => setViewMode('2d')} label="2d"/>
              <Tab value="json" onClick={() => setViewMode('json')} label="json"/>
            </Tabs>
          </Grid>
        </Grid>
      </Paper>
      <Paper
        style={{
          position: 'absolute',
          zIndex: 98,
          left: 0, top: 48,
          overflow: 'hidden',
          width: '100%',
          // $flowignore
          height: topPanelSize.size,
          ...(
            topPanelValue
            ? {
              top: 48,
            }
            :{
              top: -400,
            }
          ),
          transition: 'top 1s ease',
        }}
        elevation={topPanelValue ? layers ? 6 : 2 : 0}
      >
        <Resizable
          size={{ width: '100%', height: topPanelSize.height }}
          onResizeStop={(e, direction, ref, d) => {
            setTopPanelSizeType({
              height: topPanelSize.height + d.height,
            });
          }}
        >
          {topPanelValue === 'gql' && <div>
            <Graphiql
              query={query}
              setQuery={setQuery}
              explorerIsOpen={giqlExplorerIsOpen}
              setExplorerIsOpen={setGiqlExplorerIsOpen}
              fetcher={fetcher}
              buttons={[
                {
                  onClick: () => setTopPanelValue(null),
                  label: 'Hide',
                  title: 'Hide Graphiql',
                },
              ]}
            />
          </div>}
          {topPanelValue === 'selected' && selected && <div style={{
            padding: 16, 
            boxSizing: 'border-box',
            overflowY: 'scroll',
            height: '100%',
            width: '100%',
          }}>
            <ReactJson
              src={selected}
              indentWidth={2}
              displayDataTypes={false}
            />
          </div>}
        </Resizable>
      </Paper>
      <div style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        height: layers || !topPanelValue ? 'calc(100% - 48px)' : `calc(100% - 48px - ${topPanelSize.height}px)`,
      }}>
        <Results
          query={gql.query}
          variables={gql.variables}
          viewMode={viewMode}
          onNodeClick={onNodeClick}
        />
      </div>
    </>
  );
});
