const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user_schema = require("./schemas/user_schema");
const task_schema = require("./schemas/task_schema");
mongoose.Promise = require('bluebird');

mongoose.connect(process.env.mongo_url);
