// @flow

import { ClientRequest, ServerResponse } from 'express';

export default (req: ClientRequest, res: ServerResponse) => {
  res.send({
    abc: 123
  });
};
