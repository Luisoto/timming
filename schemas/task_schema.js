/**
 * Created by Luis Soto on 27/10/18.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    api_id: String,
    name: {type: String},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    finishedAt: Date,
    last_paused: Date,
    last_resumed: Date,
    status: {type: String, default: "Running"},
    duration: {type:Number, default: 0},
    formatted_duration: String
});

TaskSchema.pre('save', function(next) {
    const task = this;
    console.log(task.isModified('status'));
    if (task.isModified('status') && task.status === "Paused" ) {
        //If user paused a task save in object current duration (now- (created or last_resume)) and last_paused time
        const started_or_last_resumed = task.last_resumed || task.createdAt;
        task.last_paused = new Date();
        task.duration += (new Date() - started_or_last_resumed)/1000;
    }
    if (task.isModified('status') && task.status === "Running" ) {
        //If task is resume save in object last_resume to be able to calculate total time when task is finished
        task.last_resumed = new Date();
    }
    if (task.isModified('status') && task.status === "Finished" ) {
        //If task is finished save in object moment when task was finished
        task.finishedAt = new Date();
    }
    next();

});


TaskSchema.post('init', function(task) {
    let duration = 0;
    if (task.status === "Running"){
        const started_or_last_resumed = task.last_resumed || task.createdAt;
        duration = task.duration + (new Date() - started_or_last_resumed)/1000;
    }
    else{
        duration = task.duration;
    }

    const hours = String(Math.floor(duration / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
    const seconds = String(Math.round((duration % 3600) % 60)).padStart(2, "0");
    task.formatted_duration = hours + ':' + minutes + ':' + seconds

});


mongoose.model('Task', TaskSchema, "Task");