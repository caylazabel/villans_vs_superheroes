'use strict';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Promise = require('bluebird'); //eslint-disable-line
const debug = require('debug')('decor8:server');


//require all the files in as we make them //

dotenv.load();

const PORT = express.env.PORT || 3000;
const app = express();

mongoose.connect(process.env.MONGODB_URI);

let morganFormat = process.env.PRODUCTION ? 'common' : 'dev';

//indlude app.use here//
app.use(cors());
app.use(morgan(morganFormat));


const server = module.exports = app.listen(PORT, () => {
  debug(`server is up: ${PORT}`);
});

server.isRunning = true;
