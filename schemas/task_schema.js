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
    duration: {type:Number, default: 0}
});

TaskSchema.pre('save', function(next) {
    const task = this;
    //Stop last task if it is running (We will only allow one task running at time)
    console.log(task.isModified('status'));
    if (task.isModified('status') && task.status === "Paused" ) {
        const started_or_last_resumed = task.last_resumed || task.createdAt;
        task.last_paused = new Date();
        task.duration += (new Date() - started_or_last_resumed)/1000;
    }
    if (task.isModified('status') && task.status === "Running" ) {
        task.last_resumed = new Date();
    }
    if (task.isModified('status') && task.status === "Finished" ) {
        task.finishedAt = new Date();
    }
    next();

});


mongoose.model('Task', TaskSchema, "Task");