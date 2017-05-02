'use strict';

const AWS = require('aws-sdk-mock');

module.exports = exports = {};

exports.uploadMock = {
  ETag: '"1234abcd"',
  Location: 'https://mockurl.com/mock.png',
  Key: 'budda.png',
  key: 'budda.png',
  Bucket: 'villans-superheroes-test'
};

AWS.mock('S3', 'upload', function(params, callback){
  if(!params.ACL === 'public-read') {
    return callback(new Error('ACL must be public-read'));
  }
  if (!params.bucket === 'villans-superheroes-test'){
    return callback(new Error('bucket must be villans testing'));
  }
  if(!params.Key){
    return callback (new Error('key required'));
  }
  if(!params.Body){
    return callback(new Error('body required'));
  }
  callback(null, exports.uploadMock);
});
