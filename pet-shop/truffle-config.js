module.exports = {
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    // ganache :)
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    // not sure yet :(
    develop: {
      port: 8545
    }
  }
};
