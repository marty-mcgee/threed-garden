// @flow

import './style.css';

import _ from 'lodash';

import React, { useEffect, useState } from 'react';

let _ReactJson;
if (_.get(process, 'browser')) {
  _ReactJson = require('react-json-view').default;
}

export const ReactJson = (props: any) => {
  return _ReactJson ? <_ReactJson {...props}/> : <></>;
};