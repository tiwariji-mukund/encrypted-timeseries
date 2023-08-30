const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  ts: { type: Date, required: true },
  segments: {},
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

/* 
const template = {
  ts: "date",
  segments: {
    0: [
      {
        name: { type: String },
        origin: { type: String },
        destination: { type: String },
      },
    ],
    1: [{}],
    2: [{}],
    3: [{}],
    4: [{}],
    5: [{}],
  },
};
 */
