'use client'
import { Boundary } from '#/layout/ui/playground/Boundary';
import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return <Boundary>{children}</Boundary>;
}
