import React, { useEffect, useState } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

import { useGql, useMutation, gql } from '../../packages/gql/use';
import { Graph } from '../../packages/graph';
import { useParsed } from '../../packages/graph/parse';

import uniqid from 'uniqid';

import { ReactJson } from '../../packages/react-json';
import { Tabs, Tab } from '@material-ui/core';

const ADD_ROOT_NODE = gql`mutation AddRootNode($nodeId: String) {
  insert_links(objects: {id: $nodeId}) {
    returning {
      id
    }
  }
}`;

const DELETE_NODE = gql`mutation DeleteNode($nodeId: String) {
  delete_links(where: {id: {_eq: $nodeId}}) {
    returning {
      id
    }
  }
}`;

export const Results = ({ onNodeClick, query, variables, viewMode }) => {
  const { enqueueSnackbar } = useSnackbar();

  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);

  const result = useGql(query, { variables });
  const [parsed, setParsed] = useState({});
  const { nodes, links } = useParsed(history[index], parsed);

  const [addRootNode] = useMutation(ADD_ROOT_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);

  useEffect(() => {
    setHistory([ result.data, ...history.slice(0, 10) ]);
  }, [result.data]);

  return <>
    {/* <pre>{JSON.stringify(query, null, 2)}</pre>
    <pre>{JSON.stringify(variables, null, 2)}</pre>
    <pre>{JSON.stringify(result, null, 2)}</pre>
    <pre>{JSON.stringify(nodes, null, 2)}</pre>
    <pre>{JSON.stringify(links, null, 2)}</pre> */}
    {viewMode === 'json' && (
      <div style={{
        padding: 16,
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'scroll',
      }}>
        <ReactJson
          src={result.data}
          indentWidth={2}
          displayDataTypes={false}
        />
      </div>
    )}
    {(viewMode === '2d' || viewMode === '3d') && <Graph
      type={viewMode}
      nodes={nodes}
      links={links}
      onNodeClick={onNodeClick}
    />}
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}>
      <Tabs value={index} onChange={(e, v) => setIndex(v)} variant="scrollable">
        {history.map((h, i) => (
          <Tab value={i} label={i}/>
        ))}
      </Tabs>
    </div>
  </>;
};
