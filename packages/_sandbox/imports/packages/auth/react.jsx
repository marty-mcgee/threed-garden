// @flow

import React, { createContext, useCallback, useContext, useState, useEffect } from "react";

import Cookies from 'js-cookie';
import { useRouter } from "next/router";
import useAxios from 'axios-hooks';
import axios from 'axios';

import { useCookies } from "../cookies";

interface IAuthContext {
  token?: string;
  id?: string;
  localLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading?: boolean;
}

export const defaultAuthContext = {
  localLogin: async (username: string, password: string) => {},
  logout: async () => {},
};

export const defaultUserId = 'anonymous';
export const defaultToken = 'anonymous';

export const cookieToValue = (cookies: any) => ({
  token: cookies._sandbox_auth_token || defaultToken,
  id: cookies._sandbox_auth_id || defaultUserId,
});

export const AuthContext = createContext<IAuthContext>(defaultAuthContext);

export const AuthProvider = ({
  context = AuthContext,
  children,
}: {
  context?: React$Context<IAuthContext>;
  children: any;
} = {}) => {
  const { cookies, setCookie } = useCookies();
  const [loading, setLoading] = useState(false);

  const value = cookieToValue(cookies);

  const localLogin = async (username: string, password: string) => {
    setLoading(true);
    const result = await axios.get(`/api/auth/local?username=${username}&password=${password}`);
    if (result.data && !result.data.error) {
      setCookie('_sandbox_auth_token', result.data.token);
      setCookie('_sandbox_auth_id', result.data.id);
    }
    setLoading(false);
    return result.data;
  };

  const logout = async () => {
    setLoading(true);
    const result = await axios.get(`/api/auth/logout`);
    if (result.data && !result.data.error) {
      setCookie('_sandbox_auth_token', '');
      setCookie('_sandbox_auth_id', '');
    }
    setLoading(false);
    return result.data;
  };

  return <context.Provider value={{
    ...value,
    localLogin,
    logout,
    loading,
  }}>{children}</context.Provider>;
};

export function useAuth({
  context = AuthContext,
}: {
  context: React$Context<IAuthContext>;
} = {}) {
  return useContext(context);
};
