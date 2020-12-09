// This should be a DB instead
const entries = [
  {
    domain: "^testing.jj.*",
    records: [{ type: "A", address: "127.0.0.99" }],
  },
  {
    domain: "^blocked.site.*",
    records: [{ type: "A", address: "0.0.0.0" }],
  },
  {
    domain: "^cname.site.*",
    records: [{ type: "CNAME", address: "blocked.site.*" }],
  },
];

module.exports = {
  entries,
};
