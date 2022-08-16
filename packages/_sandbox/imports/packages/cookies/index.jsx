// @flow

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { parseCookies, setCookie, destroyCookie } from 'nookies'
import Cookies from 'js-cookie';
import _ from 'lodash';

export const CookiesContext = createContext<any>();

export function useCookies(context: any = CookiesContext) {
  const res = useContext(context);
  return res;
}

export const CookiesProvider = ({
  cookies = parseCookies(),
  context = CookiesContext,
  children,
}: {
  cookies: any;
  context?: any;
  children: any;
}) => {
  const [stateCookies, setStateCookies] = useState(cookies);

  const setCookie = useCallback((key, value) => {
    Cookies.set(key, value);
    setStateCookies(Cookies.get());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const newCookies = Cookies.get();
      if (!_.isEqual(newCookies, stateCookies)) {
        setStateCookies(newCookies);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <context.Provider value={{
    cookies: stateCookies,
    setCookie,
  }}>{children}</context.Provider>;
};
