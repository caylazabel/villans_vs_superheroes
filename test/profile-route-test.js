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
      .then( token => {
        this.tempToken = token;
        done();
      })
      .catch(done);
    });
    it('shoudl return a profie', done => {
      request.post(`${url}/api/profile`)
      .set({
        Authorization: `Bearer ${this.tempToken}`
      })
      .field('name', exampleProfile.name)
      .field('bio', exampleProfile.bio)
      .end((err, res) => {
        expect(res.status).to.equal(400, 'upload worked');
        done();
      });
    });
  });
  describe('with a wrong image file path', function() {
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
      .attatch('wrongImage', exampleProfile.image)
      .end((err, res) => {
        expect(res.status).to.equal(500, 'upload worked');
        done();
      });
    });
  });

  describe('GET: /api/profile/:id', function(){
    describe('with a valid id', function(){
      before(done => {
        new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then( user => user.save())
        .then( user => {
          this.tempUser = user;
          return user.generateToken();
        })
        .then(token => {
          this.tempToken = token;
          done();
        })
        .catch(done);
      });
      before(done => {
        exampleProfile.userID = this.tempUser._id;
        exampleProfile.imageURI = 'fake string';
        exampleProfile.objectKey = 'fake object key string';
        new Profile (exampleProfile).save()
        .then(profile => {
          this.tempProfile = profile;
          done();
        })
        .catch(done);
      });
      it('should return a profile', done => {
        request.get(`${url}/api/profile/${this.tempProfile._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if(err) return done(err);
          let date = new Date(res.body.created).toString();
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal('example name');
          expect(res.body.bio).to.equal('example bio');
          expect(res.body.userID).to.be.a('string');
          expect(date).to.not.equal('Invalid Date');
          done();
        });
      });
    });

    describe('with an invalid id', function () {
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfileId = profile._id;
          done();
        })
        .catch(done);
      });
      befoer(done => {
        new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then( user => user.save())
        .then( user => {
          this.tempUser = user;
          return user.generateToken();
        })
        .then(token => {
          this.tempToken = token;
          done();
        });
        it('should return a 404 status', done => {
          request.get(`${url}/api/profile/huhhh`)
          .set({
            Authorization: `Bearer ${this.tempToken}`
          })
          .end((err, res) => {
            exprect(res.status).to.equal(404);
            done();
          });
        });
      });
      describe('without a token', function(){
        before(done => {
          new User(exampleUser)
          .generatePasswordHash(exampleUser.password)
          .then(user => user.save())
          .then(user => {
            this.tempUser = user;
            return user.generateToken();
          })
          .then( token => {
            this.tempToken = token;
            done();
          })
          .catch(done);
        });
        before(done => {
          exampleProfile.userID = this.tempUser._id;
          exampleProfile.imageURI = 'fake string';
          exampleProfile.objectKey = 'fake object string';
          new Profile(exampleProfile).save()
          .then(profile => {
            this.tempProfile = profile;
            done();
          })
          .catch(done);
        });
        it('should return a profile', done => {
          request.get(`${url}/api/profile/${this.tempProfile._id}`)
          .end((err, res) => {
            expect(res.status).to.equal(401);
            done();
          });
        });
      });
    });
    describe('PUT:/api/profile/:id', function () {
    describe('With a valid body, id, and token', function(){
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
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfileId = profile._id;
          done();
        })
        .catch(done);
      });
      it('should return an updated profile', done => {
        request.put(`${url}/api/profile/${this.tempProfileId}`)
        .send({name: 'new name', bio: 'new bio'})
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal('new name');
          expect(res.body.bio).to.equal('new bio');
          done();
        });
      });
    });
    describe('with an invalid body', function(){
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfileId = profile._id;
          done();
        })
        .catch(done);
      });
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
      it('should return an updated Profile', done => {
        request.put(`${url}/api/profile/${this.temtempProfileId}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });
    describe('with a valid body, invalid id, and token', function(){
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
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfileId = profile._id;
          done();
        })
        .catch(done);
      });
      it('should return an updated profile', done => {
        request.put(`${url}/api/profile/badid`)
        .send({name: 'new name', bio: 'new bio'})
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          expect(res.status).to.equal(404);
          done();
        });
      });
    });
    describe('With a valid body, valid id, and invalid token', function(){
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfileId = profile._id;
          done();
        })
        .catch(done);
      });
      before(done => {
        new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then(user => user.save())
        .then(user => {
          this.tempUser = user;
          return user.generateToken();
        })
        .then(token => {
          this.tempToken = token;
          done();
        })
        .catch(done);
      });
      it('should return an updated Profile', done => {
        request.put(`${url}/api/profile/${this.tempProfileId}`)
        .send({name: 'new name', bio: 'new bio'})
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });
  });

  describe('DELETE: /api/profile/:id', function(){
    describe('With a valid id', function(){
      before(done => {
        new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfile = profile;
          done();
        })
        .catch(done);
      });
      before(done => {
        new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then(user => user.save())
        .then(user => {
          this.tempUser = user;
          return user.generateToken();
        })
        .then(token => {
          this.tempToken = token;
          done();
        })
        .catch(done);
      });
      it('should return a 204', done => {
        request.delete(`${url}/api/profile/${this.tempProfile._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(204);
          done();
        });
      });
    });
  });
  });
});
