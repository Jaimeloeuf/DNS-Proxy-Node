"use strict";

const async = require("async");
const dns = require("native-dns");
const server = dns.createServer();

server.on("listening", () => console.log("Listening to", server.address()));

const authority = { address: "8.8.8.8", port: 53, type: "udp" };
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

function proxy(question, response, cb) {
  console.log("proxying", question.name);

  var request = dns.Request({
    question: question, // forwarding the question
    server: authority, // this is the authoritative DNS server requests are forwarded to
    timeout: 700,
  });

  // when we get answers, append them to the response
  request.on("message", (err, msg) => {
    msg.answer.forEach((a) => response.answer.push(a));
  });

  request.on("end", cb);
  request.send();
}

server.on("request", function handleRequest(request, response) {
  console.log(
    "request from",
    request.address.address,
    "for",
    request.question[0].name
  );

  const f = []; // array of functions

  // proxy all questions
  // since proxying is asynchronous, store all callbacks
  request.question.forEach((question) => {
    const entry = entries.filter((r) =>
      new RegExp(r.domain, "i").exec(question.name)
    );

    if (entry.length)
      entry[0].records.forEach((record) => {
        record.name = question.name;
        record.ttl = record.ttl || 2592000; // Defaults to block for 1 month

        // Take care of CNAME requests too
        if (record.type == "CNAME") {
          console.log("canme found");

          record.data = record.address;
          f.push((cb) =>
            proxy(
              { name: record.data, type: dns.consts.NAME_TO_QTYPE.A, class: 1 },
              response,
              cb
            )
          );
        }

        response.answer.push(dns[record.type](record));
      });
    else f.push((cb) => proxy(question, response, cb));
  });

  // do the proxying in parallel
  // when done, respond to the request by sending the response
  async.parallel(f, function () {
    response.send();
  });
});

server.on("close", () => console.log("server closed", server.address()));
server.on("error", (err, buff, req, res) => console.error(err.stack));
server.on("socketError", (err, socket) => console.error(err));

server.serve(8090);
