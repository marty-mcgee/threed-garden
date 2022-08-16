// @flow

import React from 'react';
import Link from 'next/link';
import 'normalize.css';

const spacing = 1

export default () => (
  <div style={{margin: spacing + 'em'}}>
    <Link href="/_sandbox/picture">
      <a>
        <div>picture</div>
      </a>
    </Link>
    <Link href="/_sandbox/use-url-state">
      <a>
        <div>use-url-state</div>
      </a>
    </Link>
    <Link href="/_sandbox/mui-ssr">
      <a>
        <div>mui-ssr</div>
      </a>
    </Link>
    <Link href="/_sandbox/gql">
      <a>
        <div>gql</div>
      </a>
    </Link>
    <Link href="/_sandbox/graphiql">
      <a>
        <div>graphiql</div>
      </a>
    </Link>
    <Link href="/_sandbox/graph">
      <a>
        <div>graph</div>
      </a>
    </Link>
    <Link href="/_sandbox/react-spring-scroll">
      <a>
        <div>react-spring-scroll</div>
      </a>
    </Link>
    <Link href="/_sandbox/react-spring-sensor">
      <a>
        <div>react-spring-sensor</div>
      </a>
    </Link>
    <Link href="/_sandbox/react-spring-sensor-trail">
      <a>
        <div>react-spring-sensor-trail</div>
      </a>
    </Link>
    <Link href="/_sandbox/spring-reveals">
      <a>
        <div>spring-reveals</div>
      </a>
    </Link>
    <Link href="/_sandbox/children-responsive">
      <a>
        <div>children-responsive</div>
      </a>
    </Link>
    <Link href="/_sandbox/auth">
      <a>
        <div>auth</div>
      </a>
    </Link>
    <Link href="/_sandbox/ssr-use-router">
      <a>
        <div>ssr-use-router</div>
      </a>
    </Link>
  </div>
);
