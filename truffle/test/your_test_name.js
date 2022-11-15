const YourTestName = artifacts.require("YourContractName");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("YourContractName", function (/* accounts */) {
  it("should assert true", async function () {
    // const YourTestNameInstance = await YourTestName.deployed();
    await YourTestName.deployed();
    return assert.isTrue(true);
    // if (YourTestNameInstance) {
    //   return true
    // } else {
    //   return false
    // }
  });
});
