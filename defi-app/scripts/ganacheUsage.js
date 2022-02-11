const ganache = require("ganache");
const Web3 = require("web3"); // optional to make ganache a web3.js provider

module.exports = async function (callback) {

  // As an EIP-1193 provider only:
  // const ganache = require("ganache");

  // const options = {};
  // const provider = ganache.provider(options);
  // const accounts = await provider.request({ method: "eth_accounts", params: [] });

  // ---

  // As an EIP-1193 provider and JSON-RPC web server:
  // const ganache = require("ganache");

  const options = {};
  const server = ganache.server(options);
  const PORT = 8545;
  server.listen(PORT, err => {
    if (err) throw err;

    console.log(`ganache listening on port ${PORT}...`);
    const provider = server.provider;
    const accounts = await provider.request({
      method: "eth_accounts",
      params: []
    });
  });

  // ---

  // As a web3.js provider:
  // const Web3 = require("web3");
  // const ganache = require("ganache");

  const web3 = new Web3(ganache.provider());
  // NOTE: depending on your web3 version, you may need to set a number of confirmation blocks
  // const web3 = new Web3(ganache.provider(), null, { transactionConfirmationBlocks: 1 });
  console.log("*** web3 ***", web3)

  // ---

  // As an ethers.js provider:
  // const ganache = require("ganache");

  const provider = new ethers.providers.Web3Provider(ganache.provider());
  console.log("*** ethers ***", provider)

  // ---

  // Browser Use:
  // You can also use Ganache in the browser by adding the following script to your HTML:
  // <script src="https://cdn.jsdelivr.net/npm/ganache@{VERSION}/dist/web/ganache.min.js"></script>
  // NOTE: the {VERSION} in the above path needs to be replaced with a version number or tag that is listed in npm.

  // From there, Ganache is available in your browser for use:

  // const options = {};
  // const provider = Ganache.provider(options);

  // ---

  // End function

  callback()
}
