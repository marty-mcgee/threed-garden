const ScaffoldTest = artifacts.require("ScaffoldTest");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("ScaffoldTest", function (/* accounts */) {
  it("should assert true", async function () {
    await ScaffoldTest.deployed();
    return assert.isTrue(true);
  });
});
