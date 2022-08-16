// @flow

import React, { useState } from 'react';

import ReactResizeDetector from 'react-resize-detector';

export const ChildrenResponsive = ({
  children, style, fill = true, ...props
}: {
  [string]: any;
}) => {
  const [sizeOut, setSizeOut] = useState({ width: 0, height: 0 });
  const [sizeIn, setSizeIn] = useState({ width: 0, height: 0 });

  const onResizeOut = (width, height) => {
    setSizeOut({ width, height });
  };

  const onResizeIn = (width, height) => {
    setSizeIn({ width, height });
  };

  const w1: number = (sizeIn.width * sizeOut.width) / sizeIn.width;
  const h1: number = (sizeIn.height * sizeOut.height) / sizeIn.height;
  const p1: number = sizeIn.width / sizeIn.height;
  const p2: number = w1 / h1;
  const p = fill ? p1 > p2 : p2 > p1;
  const w2: number = p ? sizeOut.height / sizeIn.height : sizeOut.width / sizeIn.width;
  const h2: number = p ? sizeOut.height / sizeIn.height : sizeOut.width / sizeIn.width;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          ...style,
        }}
        {...props}
      >
        <ReactResizeDetector handleWidth handleHeight onResize={onResizeOut} />
        <div
          style={{
            position: 'absolute',
            left: -((sizeIn.width - sizeOut.width) / 2),
            top: -((sizeIn.height - sizeOut.height) / 2),
            transform: `scale(${w2}, ${h2})`,
          }}
        >
          <ReactResizeDetector handleWidth handleHeight onResize={onResizeIn} />
          {children}
        </div>
      </div>
    </>
  );
};
