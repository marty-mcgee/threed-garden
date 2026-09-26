'use client';

import { createContext, useContext } from 'react';

/** Scene hosts may replace local hover titles with a shared presentation. */
export const SceneHoverTitleContext = createContext(false);
export const useSceneHoverTitle = () => useContext(SceneHoverTitleContext);
