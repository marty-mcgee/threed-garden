// @flow

import React, { useContext } from 'react';

import { useUrlState } from '../../imports/packages/use-url-state';
import { wrapPage } from '../../imports/wrap-page';

export default wrapPage(() => {
  const [{ x }, setX] = useUrlState('abc', { x: 1 });
  const [{ y }, setY] = useUrlState('def', { y: 1 });

  return (
    <>
    <div>
      <pre>
        <code>{`const [{ x }, setValue] = useUrlState('abc', { x: 1 });`}</code>
      </pre>
      <div>{JSON.stringify({ x }, null, 1)}</div>
      <button
        onClick={() => setX({ x: x + 1 })}
      >{`setValue({ x: x + 1 })`}</button>
    </div>
      <div>
        <pre>
          <code>{`const [{ y }, setValue] = useUrlState('def', { y: 1 });`}</code>
        </pre>
        <div>{JSON.stringify({ y }, null, 1)}</div>
        <button
          onClick={() => setY({ y: y + 1 })}
        >{`setValue({ y: y + 1 })`}</button>
      </div>
    </>
  );
});
