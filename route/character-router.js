'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const createError = require('http-errors');
const debug = require('debug')('villans_vs_superheroes:character-router');
const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');

const Character = require('../model/character.js');
const Category = require('../model/category.js');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });

const characterRouter = module.exports = new Router();

function s3uploadProm(params) {
  debug('s3uploadProm');

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

characterRouter.post('/api/category/:categoryID/character', bearerAuth, jsonParser, upload.single('image'), function(req, res, next) {
  debug('post /api/category/:categoryID/character');

  if(!req.body.name || !req.body.desc){
    return next(createError(400, 'missing required values'));
  }
  let ext = path.extname(req.file.originalname);

  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path)
  };

  Category.findById(req.params.categoryID)
  .then( () => s3uploadProm(params))
  .then( s3data => {
    del([`${dataDir}/*`]);
    let characterData = {
      name: req.body.name,
      desc: req.body.desc,
      price: req.body.price,
      objectKey:s3data.Key,
      imageURI:s3data.Location,
      userID: req.user._id,
      categoryID:req.params.categoryID
    };
    return Category.findByIdAndAddCharacter(req.params.categoryID, characterData);
  })
  .then( character => res.json(character))
  .catch(err => next(err));


});

characterRouter.get('/api/character/:id', bearerAuth, function(req, res, next){
  debug('GET: /api/character/:id');

  Character.findById(req.params.id)
  .populate('superpowers')
  .then( character => {
    res.json(character);
  })
  .catch(next);
});

characterRouter.get('/api/character', bearerAuth, function(req, res, next){
  debug('Get: /api/character');

  Character.find({})
  .populate('superpowers')
  .then(characters => res.json(characters))
  .catch(next);
});

characterRouter.put('/api/character/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT: /api/character/:id');

  if(!req.body.name) return next(createError(400, 'name required'));
  if(!req.body.desc) return next(createError(400, 'description required'));


  Character.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( character => {
    if ( !character){
      return next(createError(404, 'character not found'));
    }
    res.json(character);
  })
  .catch(next);
});

characterRouter.delete('/api/category/:categoryID/character/:id', bearerAuth, function(req, res, next){
  debug('DELETE: /api/category/:categoryID/character/:id');

  Category.findByIdAndRemoveCharacter(req.params.categoryID, req.params.id);

  Character.findByIdAndRemove(req.params.id)
  .then(character => {
    if(!character) return next(createError(404, 'post not found'));
    res.sendStatus(204);
  })
  .catch(next);
});
