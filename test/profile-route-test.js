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
  image: `${__dirname}/data/nobody_image.jpg`
};

const exampleUser = {
  username: 'example username',
  password: 'example password',
  email: 'example email'
};

describe('Profile Routes', function () {
  before (done => {
    serverToggle.serverOn(server, done);
  });
  after (done => {
    serverToggle.serverOff(server, done);
  });
  afterEach(done => {
    Promise.all([
      User.remove({}),
      Profile.remove({})
    ])
    .then( () => done())
    .catch(done);
  });

  describe('POST: /api/profile/', function () {
    before(done => {
      new User(exampleUser)
      .generatePasswordHash(exampleUser.password)
      .then( user => user.save())
      .then( user => {
        this.tempUser = user;
        return user.generateToken();
      })
      .then( token => {
        this.tempToken = token;
        done();
      })
      .catch(done);
    });
    it('should return a profile', done => {
      request.post(`${url}/api/profile`)
      .set({
        Authorization: `Bearer ${this.tempToken}`
      })
      .field('name', exampleProfile.name)
      .field('bio', exampleProfile.bio)
      .attatch('image', exampleProfile.image)
      .end((err, res) => {
        if(err) return done(err);
        expect(res.status).to.equal(200, 'upload worked');
        expect(res.body.name).to.equal(exampleProfile.name);
        expect(res.body.bio).to.equal(exampleProfile.bio);
        expect(res.body.userID).to.be.a('string');
        expect(res.body.imageURI).to.equal(awsMocks.uploadMock.Location);
        done();
      });
    });
  });

  describe('without an image', function() {
    before(done => {
      new User(exampleUser)
      .generatePasswordHash(exampleUser.password)
      .then ( user => user.save())
      .then( user => {
        this.tempUser = user;
        return user.generateToken();
      })
    })
  })
});
