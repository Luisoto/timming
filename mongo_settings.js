/**
 * Created by Luis Soto on 27/10/18.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user_schema = require("./schemas/user_schema");
const task_schema = require("./schemas/task_schema");
const project_schema = require("./schemas/project_schema");
mongoose.Promise = require('bluebird');

mongoose.connect(process.env.mongo_url); //Remember pass "mongo_url" in environment variables
