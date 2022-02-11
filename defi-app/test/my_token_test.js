const MyTokenTest = artifacts.require("MyTokenTest");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("MyTokenTest", function (/* accounts */) {
  it("should assert true", async function () {
    await MyTokenTest.deployed();
    return assert.isTrue(true);
  });
});
