// @flow

import React, { useContext } from 'react';

import { useTheme } from '@material-ui/core';
import _ from 'lodash';

/**
 * Converter responsive-loader format into html tags picture and source.
 * @example
 * const ri = require('../images/sandbox.jpg?sizes[]=1800,sizes[]=1280,sizes[]=960,sizes[]=600,sizes[]=300,sizes[]=100');
 *
 * <Picture images={ri.images} src={ri.src} style={{ width: '100%' }} />
 * @param {object} props
 * @param {object[]} props.images
 * @param {string} props.images.$.path
 * @param {number} props.images.$.width
 * @param {number} props.images.$.height
 */
export const Picture = ({
  images, src, ...props
}: {
  images: { path: string; width: number; height: number; type?: string; }[];
  src: string;
  [string]: any;
}) => {
  return (
    <picture>
      {images.map((image, i) => {
        return (
          <source
            key={i}
            srcSet={image.path}
            media={`(min-width: ${image.width}px)`}
            type={image.type || 'image/jpeg'}
          />
        );
      })}
      <img src={src} {...props} />
    </picture>
  );
};

export default Picture;
