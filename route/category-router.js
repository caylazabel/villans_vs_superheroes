'use strict';

const Router = require('express').Router;
const debug = require('debug')('villans_vs_superheroes:bearer-auth');
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const bearerAuth = require('../lib/bearer-auth-middleware.js');

const Category = require('../model/category.js');

const categoryRouter = module.exports = Router();

categoryRouter.post('/api/category', bearerAuth, jsonParser, function(req, res, next){
  debug('Post /api/category');

  if(!req.body.categoryType) return next(createError(400, 'expected a category'));
  if(!req.body.desc) return next(createError(400, 'expected a description'));

  new Category(req.body).save()
  .then(category => res.json(category))
  .catch(next);
});
