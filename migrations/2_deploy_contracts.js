const OasisDirectProxy = artifacts.require('./OasisDirectProxy.sol');

module.exports = function(deployer, network, accounts) {
    const OasisDirectOwner = accounts[10];
    deployer.deploy(OasisDirectProxy, { from: OasisDirectOwner })
        .then(() => {
            // Clearly log the Address of the OasisDirectProxy contract for users
            console.log("\n#########################################\n");
            console.log("OasisDirect Contract Address: ", OasisDirectProxy.address);
            console.log("\n#########################################\n")
        });
};