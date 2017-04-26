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

categoryRouter.get('/api/category', bearerAuth, function(req, res, next) {
  debug('Get /api/category');

  Category.find({})
  .populate('posts')
  .then(category => res.json(category))
  .catch(next);
});

categoryRouter.get('/api/category/:id', bearerAuth, function(req, res, next){
  debug('Get /api/category/:id');

  Category.findById(req.params.id)
  .populate('characters')
  .then(category => res.json(category))
  .catch(next);
});

categoryRouter.put('/api/category/:id',
bearerAuth, jsonParser, function(req, res, next) {
  debug('Get /api/category/:id');
  if(!req.body.categoryType && !req.body.name) return next(createError(400, 'expected an update'));

  Category.findByIdAndAddCharacter(req.params.id, req.body, {new: true})
  .then(category => res.json(category))
. catch(next);
});

categoryRouter.delete('/api/category/:id', bearerAuth, function(req, res, next){
  debug('Delete /api/category/:id');
  Category.findByIdAndRemoveCharacter(req.params.id)
  .then(()=> res.sendStatus(204))
  .catch(next);
});
