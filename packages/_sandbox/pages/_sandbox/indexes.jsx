// @flow

import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import uniqid from 'uniqid';
import classNames from 'classnames';
import {
  QUERY_NODES, QUERY_LINKS, QUERY_LINKS_INDEXES,
  INSERT_LINK, INSERT_NODE, DELETE_LINK, DELETE_NODE
} from '../../imports/sandbox/indexes/gql';
import { useGql } from '../../imports/packages/gql/use';
import { wrapPage } from '../../imports/wrap-page';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { useDrag, useDrop } from 'react-dnd-cjs';
import { useMutation } from '../../imports/packages/gql/use';

const useStyles = makeStyles(() => ({
  table: {
    '&, & table, & tr, & td': {
      borderSpacing: 0,
      border: 0,
      padding: 0,
      margin: 0,
      verticalAlign: 'top',
    },
  },
  node: {
    minWidth: 20, height: 20,
    position: 'relative',
  },
  unlink: {
    minWidth: 20, height: 20,
  },
  nodeUnlink: {
    width: '100%', height: '100%',
    border: '1px dotted grey',
    padding: 3,
    boxSizing: 'border-box',
  },
  nodeDiv: {
    width: '100%', height: '100%',
    border: '1px solid grey',
    padding: 3,
    boxSizing: 'border-box',
  },
  nodeDrop: {
    background: '#00000015',
  },
  nodeDropOver: {
    background: '#00000030',
  },
  scroll: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
  },
  insertNode: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    background: '#00000015',
    border: '1px solid grey',
    '&:hover': {
      background: '#00000030',
    },
  },
}));

const Unlink = ({ children, deleteLink }) => {
  const classes = useStyles();

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'node',
    drop: (item) => deleteLink(item.node._link.id),
    canDrop: (item) => !!_.get(item, 'node._link.id'),
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  return <table className={classes.table}><tbody>
    <tr><td className={classNames(classes.unlink, canDrop && classes.nodeDrop, isOver && classes.nodeDropOver)} ref={dropRef}>
      <div className={classes.nodeUnlink}>
        <Typography variant="body2">unlink</Typography>
      </div>
    </td></tr>
    <tr><td>
      {children}
    </td></tr>
  </tbody></table>;
};

const Node = ({ data, memory, node, insertLink }) => {
  const classes = useStyles();

  const [{}, dragRef] = useDrag({
    item: { type: 'node', id: node.id, node },
    collect: monitor => ({}),
  });

  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'node',
    drop: (item) => insertLink(node.id, item.id),
    canDrop: (item) => true, // !_.find(node._node.indexes, i => i.index_of_id == item.id),
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  return <table className={classes.table}><tbody>
    <tr><td className={classNames(classes.node, canDrop && classes.nodeDrop, isOver && classes.nodeDropOver)} ref={dropRef}>
      <div className={classes.nodeDiv} ref={dragRef}>
        <Typography variant="body2" style={{ fontSize: '0.7em' }}>{node.id}</Typography>
      </div>
    </td></tr>
    <tr><td>
      <Nodes data={data} nodes={memory.nests[node.id] || []} memory={memory} insertLink={insertLink}/>
    </td></tr>
  </tbody></table>;
};

const generateMemory = (data) => {
  const memory = {
    nodes: {},
    nests: {},
    _roots: {},
    roots: [],
  };
  for (let n = 0; n < data.nodes.length; n++) {
    memory.nodes[data.nodes[n].id] = data.nodes[n];
    memory._roots[data.nodes[n].id] = data.nodes[n];
  }
  for (let l = 0; l < data.links.length; l++) {
    if (!memory.nests[data.links[l].source_id]) memory.nests[data.links[l].source_id] = [];
    memory.nests[data.links[l].source_id].push({ ...memory.nodes[data.links[l].target_id], _link: data.links[l] });
    delete memory._roots[data.links[l].target_id];
  }

  memory.roots = _.values(memory._roots);

  return memory;
};

const Nodes = ({
  data, memory = generateMemory(data), nodes, insertLink
}: any) => {
  const classes = useStyles();
  const _nodes = nodes || memory.roots;

  return <table className={classes.table}><tbody>
    <tr>
      {_nodes.map(node => (
        <td key={node.id}>
          <Node key={node.id} data={data} memory={memory} node={node} insertLink={insertLink}/>
        </td>
      ))}
    </tr>
  </tbody></table>;
};

export default wrapPage(() => {
  const classes = useStyles();

  const [history, setHistory] = useState([]);

  const [_insertLink] = useMutation(INSERT_LINK);
  const insertLink = useCallback((sourceId, targetId) => _insertLink({ variables: { sourceId, targetId, typeId: 1 } }));
  const [_deleteLink] = useMutation(DELETE_LINK);
  const deleteLink = useCallback((linkId) => _deleteLink({ variables: { linkId } }));
  const [_insertNode] = useMutation(INSERT_NODE);
  const insertNode = useCallback(() => _insertNode({ variables: { objects: { id: uniqid() } } }));

  const { data: ns, loading: ns_l } = useGql(QUERY_NODES);
  const { data: ls, loading: ls_l } = useGql(QUERY_LINKS);
  const { data: lis, loading: lis_l } = useGql(QUERY_LINKS_INDEXES);

  const loading = ns_l || ls_l || lis_l;
  const data = {
    nodes: _.get(ns, 'links', []),
    links: _.get(ls, 'links', []),
    links_indexes: _.get(lis, 'links_indexes', []),
  };

  return <div className={classes.scroll}>
    <Unlink deleteLink={deleteLink}>
      <Nodes data={data} insertLink={insertLink}/>
    </Unlink>
    <div className={classes.insertNode} onClick={insertNode}>+</div>
  </div>;
});
