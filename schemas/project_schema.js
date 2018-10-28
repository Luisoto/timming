/**
 * Created by Luis Soto on 27/10/18.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    api_id: String,
    name: String,
    tasks: Array,
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

mongoose.model('Project', ProjectSchema, "Project");