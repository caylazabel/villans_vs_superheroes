'use strict';

const jsonParser = require('body-parser').json();
const debug = require('debug')('villans_vs_superheroes:weapon-router');
const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');
const Router = require('express').Router;
const createError = require('http-errors');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

const Weapon = require('../model/weapon.js');
const Character = require('../model/character.js');
AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });

const weaponRouter = module.exports = Router();

function s3uploadProm(params) {
  debug('s3uploadProm');

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      if (err) return reject(err);
      resolve(s3data);
    });
  });
}


weaponRouter.post('/api/character/:characterId/weapon', bearerAuth, upload.single('image'), jsonParser,  function(req, res, next) {
  debug('/api/character/:characterId/weapon');

  if(!req.body.message) return next(createError(400, 'expected a message'));

  let ext = path.extname(req.file.originalname);

  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path)
  };
  Character.findById(req.params.characterId)
  .then(() => s3uploadProm(params))
  .then(s3data => {
    del([`${dataDir}/*`]);
    let weaponData = {
      message: req.body.message,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userId: req.user._id,
      characterId: req.params.characterId
    };
    return Character.findByIdAndAddWeapon(req.params.characterId, weaponData);
  })
  .then(weapon => res.json(weapon))
  .catch(err => next(err));
});

weaponRouter.get('/api/weapon/:id', bearerAuth, function(req, res, next) {
  debug('GET: api/weapon/:id');

  Weapon.findById(req.params.id)
  .then(weapon => {
    if ( weapon.userId.toString() !== req.user._id.toString()){
      return next(createError(401, 'invalid user'));
    }
    res.json(weapon);
  })
  .catch(next);
});

weaponRouter.put('/api/weapon/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT api/weapon/:id');

  if(!req.body.message) return next(createError(400, 'expected an message.'));
  Weapon.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( weapon => {
    res.json(weapon);
  })
  .catch(next);
});

weaponRouter.put('/api/weapon/:id/upvote', bearerAuth, jsonParser, function(req, res, next) {
  debug('PUT api/weapon/:id/upvote');

  if(!req.body.message) return next(createError(400, 'expected an message.'));
  Weapon.findById(req.params.id)
  .then( weapon => {
    weapon.upVote += 1;
    weapon.message = req.body.message;
    return Weapon.findByIdAndUpdate(req.params.id, weapon, { new: true });
  })
    .then( weapon => {
      res.json(weapon);
    })
    .catch(err => console.log(err));
});




weaponRouter.delete('/api/character/:characterId/weapon/:id', bearerAuth, function(req, res, next) {
  debug('DELETE api/weapon/:id');

  Character.findByIdAndRemoveWeapon(req.params.characterId, req.params.id);

  Weapon.findByIdAndRemove(req.params.id)
  .then( weapon => {
    if(!weapon) return next(createError(404, 'weapon not found'));
    res.sendStatus(204);
  })
  .catch(next);
});
