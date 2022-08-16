import rp from 'request-promise';

export async function export_metadata() {
  return await rp({
    method: 'POST',
    uri: `https://${process.env.HASURA_PATH}/v1/query`,
    headers: {
      'X-Hasura-Admin-Secret': process.env.HASURA_SECRET,
    },
    body: {
      type: 'export_metadata',
      args: {},
    },
    json: true,
  });
}
