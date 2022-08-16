import rp from 'request-promise';

export async function replace_metadata(metadata) {
  await rp({
    method: 'POST',
    uri: `https://${process.env.HASURA_PATH}/v1/query`,
    headers: {
      'X-Hasura-Admin-Secret': process.env.HASURA_SECRET,
    },
    body: {
      type: 'replace_metadata',
      args: metadata,
    },
    json: true,
  });
}
