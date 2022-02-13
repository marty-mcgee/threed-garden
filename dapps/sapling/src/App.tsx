/** @jsx jsx */
import { jsx } from '@emotion/core';
import { useState } from 'react';
import { ControlPanel } from './ControlPanel';
import { MeshGenerator } from './MeshGenerator';
import { SceneView } from './SceneView';
import styled from '@emotion/styled';

const SceneContainer = styled.section`
  flex: 1 1 0;
  position: relative;
  overflow: hidden;

  > section {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    overflow: hidden;
  }
`;

function App() {
  const [generator] = useState(() => new MeshGenerator());

  return (
    <div
      className="App"
      css={{
        position: 'fixed',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
      }}
    >
      <ControlPanel generator={generator} />
      <SceneContainer>
        <SceneView generator={generator} />
      </SceneContainer>
    </div>
  );
}

export default App;
