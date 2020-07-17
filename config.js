module.exports = {
  // Port for the DNS server
  port: 8090,

  // The DNS server to proxy
  authority: {
    address: "8.8.8.8",
    port: 53,
    type: "udp",
  },
};
