module.exports = {
  networks: {
    // Run development on port launched by dai.js testchain script
    //    ./testchain/scripts/with-deployed-system
    development: {
      host: "127.0.0.1",
      port: 2000,
      network_id: "*", // match any network
    },
  }
};