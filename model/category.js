'use strict';

const mongoose = require('mongoose');
const createError = require('http-errors');
const debug = require('debug')('decor8:category');
const Schema = mongoose.Schema;

const Character = require('./character.js');

// dont need the ability to create category.  either the character is a hero or villan
const categorySchema = Schema({
  categoryType: {type:String, required: true},
  desc: {type:String, required:true},
  characters: [{type: Schema.Types.ObjectId, ref: 'character' }]
});

const Category = module.exports = mongoose.model('category', categorySchema);

Category.findByIdAndAddCharacter = function(id, character){
  debug('findByIdAndAddCharacter');

  return Category.findById(id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(category => {
    this.tempCategory = category;
    return new Character(character).save();
  })
  .then(character => {
    this.tempCategory.characters.push(character._id);
    this.tempCharacter = character;
    return this.tempCategory.save();
  })
  .then(() => {
    return this.tempCharacter;
  });
};

Category.findByIdAndRemoveCharacter = function(id, characterId){
  debug('findByIdAndAddCharacter');
  Category.findById(id)
  .then(category => {
    for(var i = 0; i < category.characters.length; i++){
      if(category.characters[i] == characterId){
        category.characters.splice(i, 1);
      }
    }
    Category.findByIdAndUpdate(id, category, {new: true})
    .then(() => {
      return;
    })
    .catch(err => Promise.reject(createError(404, err.message)));
    return characterId;
  })
  .catch(err => Promise.reject(createError(404, err.message)));
};
