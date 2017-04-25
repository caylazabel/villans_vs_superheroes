'use strict';

const debug = require('debug')('villans_vs_superheroes:basic-auth');
const createError = require('http-errors');

module.exports = function(req, res, next) {
  debug('basic-auth');

  var authHeader = req
}
