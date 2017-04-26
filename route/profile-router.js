'use strict';

const jsonParser = require('body-parser').json();
const debug = require('debug')('villans_vs_superheroes:bearer-auth');
const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');
const Router = require('express').Router;
const createError = require('http-errors');

const Profile = require('../model/profile.js');
const bearerAuth = require('../lib/bearer-auth-middleware');


AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });

const profileRouter = module.exports = Router();

function s3UploadProm(params) {
  debug('s3UploadProm');
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      if (err) return reject(err);
      resolve(s3data);
    });
  });
}

profileRouter.post('/api/profile', bearerAuth, upload.single('image'), jsonParser, function(req, res, next){
  debug('POST: /api/profile');
  if(!req.file) {
    return next(createError(400, 'file not saved'));
  }
  if(!req.file.path) {
    return next(createError(500, 'file not saved'));
  }

  let ext = path.extname(req.file.originalname);

  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path)
  };

  s3UploadProm(params)
  .then( s3data => {
    del([`${dataDir}/*`]);
    let imageData = {
      name: req.body.name,
      bio: req.body.bio,
      created: req.body.created,
      userID: req.user._id,
      imageURI: s3data.Location,
      objectKey: s3data.Key
    };
    return new Profile(imageData).save();
  })
  .then (profile => res.json(profile))
  .catch( err => next(err));
});
