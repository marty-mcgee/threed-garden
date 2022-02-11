import styled from '@emotion/styled';
import clsx from 'clsx';
import React, { memo, useState, useEffect, useCallback } from 'react';
import { MeshGenerator } from './MeshGenerator';
import { SceneRenderer } from './SceneRenderer';
import { TriangleCount } from './TriangleCount';

const DropHighlight = styled.section`
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  right: 4px;
  pointer-events: none;

  &.drag-over {
    border: 6px dashed #ffffff22;
  }
`;

interface Props {
  className?: string;
  generator: MeshGenerator;
}

/** React component that displays a three.js scene. */
export const SceneView: React.FC<Props> = memo(({ className, generator }) => {
  const [elt, setElt] = useState<HTMLElement | null>(null);
  const [canDrop, setCanDrop] = useState(false);

  // We can't construct the renderer until we have an element to attach it to.
  useEffect(() => {
    if (elt) {
      const renderer = new SceneRenderer(elt, generator);

      // Destroy renderer when element changes or this component goes out of scope.
      return () => renderer.dispose();
    }
  }, [elt, generator]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setCanDrop(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setCanDrop(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.glb')) {
        generator.fromFile(file);
      }
    }
    setCanDrop(false);
  }, [generator]);

  return (
    <section
      ref={setElt}
      className={className}
      onDragEnter={onDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <DropHighlight className={clsx(canDrop && 'drag-over')} />
      <TriangleCount generator={generator} />
    </section>
  );
});
