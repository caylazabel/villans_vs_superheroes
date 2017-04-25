'use strict';

const createError = require('http-errors');
const Promise = require('bluebird');
const debug = require('debug')('villans_vs_superheroes:character');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Superpower = require('./superpower.js');
const characterSchema = Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true },
  userID: { type: Schema.Types.ObjectId, required: true },
  categoryID: { type: Schema.Types.ObjectId, required: true },
  superpowers: [{ type: Schema.Types.ObjectId, ref: 'superpower' }],
  imageURI: { type: String, required: true, unique: true },
  objectKey: { type: String, required: true, unique: true },
  created: { type: Date, default: Date.now }
});

const Character = module.exports = mongoose.model('character', characterSchema);

Character.findByIdAndAddSuperpower = function(id, superpower) {
  debug('findByIdAndAddSuperpower');

  return Character.findById(id)
    .catch(err => Promise.reject(createError(404, err.message)))
    .then(character => {
      this.tempCharacter = character;
      return new Superpower(superpower).save();
    })
    .then(superpower => {
      this.tempCharacter.superpowers.push(superpower._id);
      this.tempSuperpower = superpower;
      return this.tempCharacter.save();
    })
    .then(() => {
      return this.tempSuperpower;
    });
};
Character.findByIdAndRemoveSuperpower = function(id, superpowerId) {
  debug('findByIdAndAddSuperpower');
  Character.findById(id)
  .then(character => {
    for (var i = 0; i < character.superpowers.length; i++) {
      if (character.superpowers[i] == superpowerId) {
        character.superpowers.splice(i, 1);
      }
    }
    Character.findByIdAndUpdate(id, character, {new: true})
    .then(() => {
      return;
    })
    .catch(err => Promise.reject(createError(404, err.message)));
    return superpowerId;
  })
  .catch(err => Promise.reject(createError(404, err.message)));
};
