// @flow

import React, { useContext, useEffect, useState } from 'react';

import ApolloClient from 'apollo-client';

import { useRouter as _useRouter } from 'next/router';
import { getDataFromTree } from '@apollo/react-ssr';
import { parseCookies } from 'nookies'
import { ApolloProvider } from '@apollo/react-hooks';
import { RouterContext } from 'next-server/dist/lib/router-context';

import { generateApolloClient } from './';
import { CookiesProvider } from '../cookies';
import { AuthProvider, cookieToValue, useAuth } from '../auth/react';

const getStorage = () => {
  // $flowignore
  if (process.browser) {
    return window;
  } else {
    return {};
  }
};

export const generateApolloClientLocal = (apolloState: any, options: any, clearCache: boolean = false) => {
  const storage = getStorage();
  const apolloClient = storage.__apolloClient && !clearCache ? storage.__apolloClient : generateApolloClient(apolloState, options);
  storage.__apolloClient = apolloClient;
  return apolloClient;
};

/**
 * Wrap page for privide apolloClient and build server render based on nextjs async getInitialProps.
 * @param {object} options
 * @param {function} options.Component
 * @param {string=} options.gqlSecret
 * @param {string=} options.gqlPath
 * @returns {function} WrappedComponent
 */
export const wrapSsrGql = ({
  Component: Content, gqlSecret, gqlPath,
}: {
  Component: any; gqlSecret?: string; gqlPath?: string;
}) => {
  const AuthApolloContent = ({
    apolloClient,
    apolloState,
    Content,
  }) => {
    const auth = useAuth();

    const [lastToken, setLastToken] = useState(auth. token);
    const [ac, setAc] = useState(apolloClient);

    useEffect(() => {
      if (lastToken !== auth.token) {
        setLastToken(auth. token);
        setAc(generateApolloClientLocal({}, {
          token: auth. token,
          secret: gqlSecret,
          path: gqlPath,
        }, true));
      }
    }, [auth]);

    return <ApolloProvider client={ac}>
      <Content />
    </ApolloProvider>
  };

  const Component = ({
    apolloState, apolloClient, cookies, router,
  }: {
    apolloState: any; apolloClient: ApolloClient; cookies: any; router: any;
  }) => {
    const _router = _useRouter();

    return (
      <RouterContext.Provider value={_router || router}>
        <CookiesProvider cookies={cookies}>
          <AuthProvider>
            <AuthApolloContent apolloState={apolloState} apolloClient={apolloClient} Content={Content}/>
          </AuthProvider>
        </CookiesProvider>
      </RouterContext.Provider>
    );
  };

  const Page = ({
    apolloState, cookies, router
  }: {
    apolloState: any; cookies: any; router: any;
  }) => {
    const storage = getStorage();
    const value =  cookieToValue(cookies || {});

    const apolloClient = generateApolloClientLocal(apolloState, {
      token: value.token,
      secret: gqlSecret,
      path: gqlPath,
    });

    const container = <Component apolloState={apolloState} apolloClient={apolloClient} cookies={cookies} router={router}/>;
    return container;
  };

  Page.getInitialProps = async props => {
    if (Content.getInitialProps) await Content.getInitialProps(props);

    const cookies = parseCookies(props);
    const value =  cookieToValue(cookies || {});

    const apolloClient = generateApolloClient({}, {
      token: value.token,
      secret: gqlSecret,
      path: gqlPath,
    });
    await getDataFromTree(
      <Component apolloState={{}} apolloClient={apolloClient} cookies={cookies} router={{ query: props.query, pathname: props.pathname, asPath: props.asPath }}/>,
    );
    const apolloState: any = apolloClient.extract();
    apolloClient.stop();
    return { apolloState, cookies, router: { query: props.query, pathname: props.pathname, asPath: props.asPath } };
  };

  return Page;
};

export function useRouter() {
  return useContext(RouterContext);
}
