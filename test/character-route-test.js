'use strict';

require('./lib/test-env.js');

const expect = require('chai').expect;
const request = require('superagent');
const Promise = require('bluebird');
const awsMocks = require('./lib/aws-mocks.js');

const Character = require('../model/character.js');
const User = require('../model/user.js');
const Category = require('../model/category.js');
const Superpower = require('../model/superpower.js');

// const AWS = require('aws-sdk-mock');

const serverToggle = require('./lib/server-toggle.js');
const server = require('../server.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'exampleuser',
  password: '1234',
  email: 'exampleuser@test.com'
};

const exampleCategory = {
  categoryType: 'test categoryTypre',
  story: 'test category story'
};

const exampleCharacter = {
  name: 'example character name',
  story: 'example character story',
  price: 4,
  image: `${__dirname}/data/tester.png`,
};

const exampleSuperpower = {
  message: 'example message',
  imageURI: 'example URI',
  objectKey: 'example Key'
};

describe('Character Routes', function() {
  before( done => {
    serverToggle.serverOn(server, done);
  });

  after( done => {
    serverToggle.serverOff(server, done);
  });

  afterEach( done => {
    Promise.all([
      Character.remove({}),
      User.remove({}),
      Category.remove({})
    ])
    .then( () => done())
    .catch(done);
  });

  describe('POST: /api/category/:categoryID/character', function() {
    describe('with a valid token and valid data', function() {
      before( done => {
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

      before( done => {
        new Category(exampleCategory).save()
        .then( category => {
          this.tempCategory = category;
          done();
        })
        .catch(done);
      });

      it('should return a character', done => {
        request.post(`${url}/api/category/${this.tempCategory._id}/character`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .field('name', exampleCharacter.name)
        .field('story', exampleCharacter.story)
        .field('price', exampleCharacter.price)
        .attach('image', exampleCharacter.image)
        .end((err, res) => {

          Category.findById(this.tempCategory._id)
          .then(() => {
          })
          .catch(done);
          if (err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal(exampleCharacter.name);
          expect(res.body.story).to.equal(exampleCharacter.story);
          expect(res.body.categoryID).to.equal(this.tempCategory._id.toString());
          expect(res.body.imageURI).to.equal(awsMocks.uploadMock.Location);
          done();
        });
      });
    });

    describe('with invalid body', function(){
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
        .catch();
      });

      it('should return a 400 for bad request', done => {
        request.post(`${url}/api/category/categoryID/character`)
        .send({})
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });
    describe('if no token found', () => {
      it('should return a 401 status code', done => {
        request.post(`${url}/api/category/categoryID/character`)
        .send(exampleCharacter)
        .set({})
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });
  });

  describe('GET: /api/character/:id', () => {
    before( done => {
      new User (exampleUser)
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
    before( done => {
      new Category(exampleCategory).save()
      .then( category => {
        this.tempCategory = category;
        done();
      })
      .catch(done);
    });
    before ( done => {
      exampleCharacter.userID = this.tempUser._id;
      exampleCharacter.imageURI = 'stuff';
      exampleCharacter.objectKey = 'stuff';
      exampleCharacter.categoryID = this.tempCategory._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });
    before(done => {
      exampleSuperpower.userId = this.tempUser._id;
      exampleSuperpower.characterId = this.tempCharacter._id;
      new Superpower(exampleSuperpower).save()
      .then(superpower => {
        this.tempCharacter.superpowers.push(superpower._id);
        return Character.findByIdAndUpdate(this.tempCharacter._id, this.tempCharacter, {new:true});
      })
      .then(character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });

    after( done => {
      delete exampleCharacter.userID;
      done();
    });

    it('should return a character', done => {
      request.get(`${url}/api/character/${this.tempCharacter._id}`)
      .set({
        Authorization: `Bearer ${this.tempToken}`
      })
      .end((err, res) => {
        if(err) return done(err);
        expect(res.status).to.equal(200);
        expect(res.body.name).to.equal(exampleCharacter.name);
        expect(res.body.story).to.equal(exampleCharacter.story);
        expect(res.body.categoryID).to.equal(this.tempCategory._id.toString());
        expect(res.body.imageURI).to.equal('stuff');
        expect(res.body.userID).to.be.a('String');
        expect(res.body.superpowers.length).to.equal(1);
        expect(res.body.superpowers[0].message).to.equal('example message');
        done();
      });
    });

    it('should return a character', done => {
      request.get(`${url}/api/character/badid`)
      .set({
        Authorization: `Bearer ${this.tempToken}`,
      })
      .end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
    });
    describe('invalid if no token found', () => {
      it('should return a 401 status', done => {
        request.get(`${url}/api/character/badid`)
        .set({})
        .end((err, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });
    });
  });
  describe('GET: /api/character', function(){
    beforeEach( done => {
      new User (exampleUser)
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
    beforeEach( done => {
      new Category(exampleCategory).save()
      .then( category => {
        this.tempCategory = category;
        done();
      })
      .catch(done);
    });
    beforeEach( done => {
      exampleCharacter.userID = this.tempUser._id;
      exampleCharacter.imageURI = 'stuff';
      exampleCharacter.objectKey = 'stuff';
      exampleCharacter.categoryID = this.tempCategory._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });
    beforeEach( done => {
      new Character({
        name: 'example name 2',
        story: 'example story2',
        weakness: 'example weakness',
        userID: this.tempUser._id,
        categoryID: this.tempCategory._id,
        imageURI: 'exampleURI 2',
        objectKey: 'exmapleObjectKey 2'
      }).save()
      .then(character => {
        this.tempCharacter2 = character;
        done();
      })
      .catch(done);
    });
    afterEach( done => {
      delete exampleCharacter.userID;
      done();
    });
    describe('with a token', () => {
      it('should return all characters', done => {
        request.get(`${url}/api/character`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(2);
          done();
        });
      });
    });
  });
  describe('PUT: /api/character/:id', function(){
    before( done => {
      new User (exampleUser)
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
    before ( done => {
      exampleCharacter.userID = this.tempUser._id;
      new Character(exampleCharacter).save()
      .then( character => {
        this.tempCharacter = character;
        done();
      })
      .catch(done);
    });
    describe('with valid body, id and token', () => {
      it('should return an updated Character', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id}`)
        .send({ name: 'new name',
          story: 'new story',
          price: 11})
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal('new name');
          expect(res.body.story).to.equal('new story');
          expect(res.body.price).to.equal(11);
          done();
        });
      });
    });
    describe('with an invalid body', () => {
      it('should return a 400 error', done => {
        request.put(`${url}/api/character/${this.tempCharacter._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .send({ NahName:'blahwrong', DuhDesc:'wrongupdate'})
        .end((err, res) => {
          expect(res.status).to.equal(400);
          done();
        });
      });
    });
    describe('with an unfound character ID', () => {
      it('should return a 404', done => {
        request.put(`${url}/api/character/`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .send({name: 'no dice', story: 'no luck'})
        .end((err, res) => {
          expect(err.message).to.equal('Not Found');
          expect(res.status).to.equal(404);
          done();
        });
      });
    });
  });
  describe('with an invalid token', () => {
    it('should return a 401 error', done => {
      request.put(`${url}/api/character/${this.tempCharacter._id}`)
        .set({
          Authorization: 'Bear claws'
        })
        .send({name: 'nope', story:'nada', price: 1 })
        .end((err, res) => {
          expect(err.message).to.equal('Unauthorized');
          expect(res.status).to.equal(401);
          done();

        });
    });
  });

  describe('Delete /api/category/:categoryID/character/:id', function(){
    describe('With a valid id', function(){
      before ( done => {
        // exampleCharacter.userID = this.tempUser._id;
        new Character(exampleCharacter).save()
          .then( character => {
            this.tempCharacter = character;
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
      before(done => {
        new Category(exampleCategory).save()
          .then(category => {
            this.tempCategory = category;
            category.characters.push(this.tempCharacter._id);
            Category.findByIdAndUpdate(category._id, category, {new:true})
            .then(() => {
              return;
            }).
            catch(done);
            done();
          })
          .catch(done);
      });
      it('should return a 204', done => {
        request.delete(`${url}/api/category/${this.tempCategory._id}/character/${this.tempCharacter._id}`)
          .set({
            Authorization: `Bearer ${this.tempToken}`
          })
          .end((err, res) => {
            Category.findById(this.tempCategory._id)
            .then(() => {
              return;
            })
            .catch(done);
            if(err) return done(err);
            expect(res.status).to.equal(204);
            done();
          });
      });
    });
  });
});
