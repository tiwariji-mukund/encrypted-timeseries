const crypto = require("crypto");
const { createHmac, timingSafeEqual } = require("crypto");

const getRoundedDate = (minutes, d = new Date()) => {
  let ms = 1000 * 60 * minutes; // convert minutes to ms
  let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

  return roundedDate;
};

const getSegmentIndex = (d = new Date()) => {
  return parseInt(d.getSeconds() / 10);
};

const validateHmac = (hmac, body) => {
  const message = JSON.stringify(body);
  const HMAC_HASH_SECRET = process.env.HMAC_HASH_SECRET;

  // Now we convert the hashes to Buffer because the timingSafeEqual needs them
  // as types Buffer, TypedArray or DataView
  const providedHmac = Buffer.from(hmac, "utf-8");
  const generatedHash = Buffer.from(
    createHmac("SHA256", HMAC_HASH_SECRET).update(message).digest("base64"),
    "utf-8"
  );

  // This method operates with secret data in a way that does not leak
  // information about that data through how long it takes to perform
  // the operation.
  // You could compare the hashes as string, but you should compare timing in
  // order to make your code safer.
  if (!timingSafeEqual(generatedHash, providedHmac)) {
    // The message was changed, the HMAC is invalid or the timing isn't safe
    throw new Error("Invalid request");
  }
};

const decryptAndValidateData = async (messageArray, time) => {
  const decryptArray = [];
  const HMACFailCount = 0;

  const iv = process.env.INITIALIZATION_VECTOR;
  const key = process.env.ENCRYPT_DECRYPT_KEY;

  try {
    messageArray.forEach((element) => {
      const decrypter = crypto.createDecipheriv("aes-256-ctr", key, iv);
      let decryptedMsg = decrypter.update(element, "hex", "utf8");
      decryptedMsg += decrypter.final("utf8");

      const { secret_key, ...originalMessage } = JSON.parse(decryptedMsg);

      try {
        validateHmac(secret_key, originalMessage);

        originalMessage["timestamp"] = time;

        decryptArray.push(originalMessage);
      } catch (error) {
        ++HMACFailCount;
      }
    });
    const failureRate = (HMACFailCount / messageArray.length) * 100;

    return { decryptArray, failureRate };
  } catch (err) {
    console.log(err);
  }
};

const upsert = async (Collection, data, time) => {
  const minuteDate = getRoundedDate(1, time);
  const segmentIndex = getSegmentIndex(time);

  try {
    const findRes = await Collection.find({ ts: minuteDate });
    if (findRes.length === 0) {
      const message = new Collection({
        ts: minuteDate,
        segments: { [segmentIndex]: data },
      });

      const insertRes = await message.save();
      return insertRes;
    } else {
      const updateRes = await Collection.findByIdAndUpdate(
        { _id: findRes[0]._id },
        {
          ts: findRes[0].ts,
          segments: {
            ...findRes[0].segments,
            [segmentIndex]: data,
          },
        }
      );
      return updateRes;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  validateHmac,
  decryptAndValidateData,
  upsert,
  getRoundedDate,
  getSegmentIndex,
};
