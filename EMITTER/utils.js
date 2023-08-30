const { createHmac } = require("crypto");
// The shared secret should be an extremely complex string,
// in order to avoid brute force attacks
const sharedSecret = process.env.HMAC_HASH_SECRET;
function getHmac(body) {
  // The object is converted to a string because the update method
  // only accepts string, Buffer, TypedArray or DataView as types.
  const message = JSON.stringify(body);

  //
  // crypto.createHmac(algorithm, key[, options]): this method creates the HMAC.
  // we use the algorithm SHA256 that will combine the shared
  // secret with the input message and will return a hash digested as a base64
  // string.
  const hmac = createHmac("SHA256", sharedSecret)
    .update(message, "utf-8")
    .digest("base64");

  return hmac;
}

module.exports = { getHmac };
