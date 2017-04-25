'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const superpowerSchema = Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  characterId: {type: Schema.Types.ObjectId, required: true },
  desc: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  objectKey: { type: String, required: true, unique: true },
  imageURI: { type: String, required: true },
});


module.exports = mongoose.model('superpower', superpowerSchema);
