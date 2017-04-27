'use strict';

const jsonParser = require('body-parser').json();
const debug = require('debug')('villans_vs_superheroes:superpower-router');
const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');
const Router = require('express').Router;
const createError = require('http-errors');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

const Superpower = require('../model/superpower.js');
const Character = require('../model/character.js');
AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });

const superpowerRouter = module.exports = Router();

function s3uploadProm(params) {
  debug('s3uploadProm');

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      if (err) return reject(err);
      resolve(s3data);
    });
  });
}


superpowerRouter.post('/api/character/:characterId/superpower', bearerAuth, upload.single('image'), jsonParser,  function(req, res, next) {
  debug('/api/character/:characterId/superpower');

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
    let superpowerData = {
      message: req.body.message,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userId: req.user._id,
      characterId: req.params.characterId
    };
    return Character.findByIdAndAddSuperpower(req.params.characterId, superpowerData);
  })
  .then(superpower => res.json(superpower))
  .catch(err => next(err));
});

superpowerRouter.get('/api/superpower/:id', bearerAuth, function(req, res, next) {
  debug('GET: api/superpower/:id');

  Superpower.findById(req.params.id)
  .then(superpower => {
    if ( superpower.userId.toString() !== req.user._id.toString()){
      return next(createError(401, 'invalid user'));
    }
    res.json(superpower);
  })
  .catch(next);
});

superpowerRouter.put('/api/superpower/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT api/superpower/:id');

  if(!req.body.message) return next(createError(400, 'expected an message.'));
  Superpower.findByIdAndUpdate(req.params.id, req.body, { new: true })
  .then( superpower => {
    res.json(superpower);
  })
  .catch(next);
});



superpowerRouter.delete('/api/character/:characterId/superpower/:id', bearerAuth, function(req, res, next) {
  debug('DELETE api/superpower/:id');

  Character.findByIdAndRemoveSuperpower(req.params.characterId, req.params.id);

  Superpower.findByIdAndRemove(req.params.id)
  .then( superpower => {
    if(!superpower) return next(createError(404, 'superpower not found'));
    res.sendStatus(204);
  })
  .catch(next);
});
