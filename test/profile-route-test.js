'use strict';

require('./lib/test-env.js');

const expect = require('chai').expect;
const request = require('superagent');
const Profile = require('../model/profile.js');
const User = require('../model/user.js');
const awsMocks = require('./lib/aws-mocks.js');

require('../model/profile.js');
require('../model/user.js');

const serverToggle = require('./lib/server-toggle.js');
const server = require('server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleProfile = {
  name: 'example name',
  bio: 'example bio',
  image:${__dirname}/data/nobody_image.jpg`
}; 
}
