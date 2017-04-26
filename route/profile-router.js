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
