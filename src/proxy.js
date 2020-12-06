"use strict";

const dns = require("native-dns");
const config = require("./config");

module.exports = function proxy(question, response, cb) {
  const request = dns.Request({
    question: question, // forwarding the question
    server: config.authority, // this is the authoritative DNS server where requests are forwarded to
    timeout: 700,
  });

  // when we get answers, append them to the response
  // @todo Handle error(s)
  request.on("message", (err, msg) => msg.answer.forEach(response.answer.push));
  request.on("end", cb);
  request.send();
};
