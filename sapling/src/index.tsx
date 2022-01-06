import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { CacheProvider, Global, css } from '@emotion/core';
import createCache from '@emotion/cache';

// Keep emotion from complaining about 'first-child'.
const emotionCache = createCache();
emotionCache.compat = true;

ReactDOM.render(
  <React.StrictMode>
    <CacheProvider value={emotionCache}>
      <Global
        styles={css`
          body {
            margin: 0;
            font-family: 'Exo 2', sans-serif;
            overflow: hidden;
          }
        `}
      />
      <App />
    </CacheProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
