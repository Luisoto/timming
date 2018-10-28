/**
 * Created by Luis Soto on 27/10/18.
 */

let express = require('express');
let router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
let User = mongoose.model("_User");
let Task = mongoose.model('Task');
let Project = mongoose.model('Project');
let _ = require('lodash');

//Function to finish a task, is called when user start another task
function finish_task (task){
    return new Promise(function (resolve, reject) {
        //Save duration only is task is running
        if (task.status === "Running"){
            const started_or_last_resumed = task.last_resumed || task.createdAt;
            task.duration += (new Date() - started_or_last_resumed)/1000;
        }
        task.status = "Finished";
        task.save(function (err, new_task) {
            if (err){
                reject(err);
            }
            else {
                resolve(new_task);
            }
        });
    });
}
//Endpoint to get all users
router.get('/', function(req, res, next) {

    //List all users I send a field called formatted_duration this is duration in hours, minutes and seconds,
    // but if another formatted is needed I also send duration in seconds, of this way applications
    // can formatted duration as they needed
    /*
    curl -X GET \
      'http://qrvey.aquehorajuega.co:8000/tasks?api_id=fbe04a90-d9f7-11e8-b610-2d17ef64d214' \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
    */

    User.aggregate([
        {
            $lookup: {
                from: "Project",
                localField: "api_id",
                foreignField: "api_id",
                as: "projects"
            }
        },
        {
            $unwind: "$projects"
        }/*,

        {
            $lookup: {
                from: "Task",
                localField: "projects.tasks",
                foreignField: "_id",
                as: "projects.tasks"
            }
        },
        { $group: {
                _id: {
                    _id: "$_id",
                    api_id: "$api_id",
                    email:"$email",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    is_admin: "$is_admin"
                },
                "projects": {"$push": "$projects"}
            }
        },
        {
            $lookup: {
                from: "Task",
                localField: "_id.api_id",
                foreignField: "api_id",
                as: "tasks"
            }
        }*/

    ]).exec(function (err, users){
        if (err) res.status(500).json({ error: true, message: err });
        else {
            let users_to_send = [];
            _.forEach(users, function (user) {
                let user_to_send = {
                    _id: user._id._id,
                    email: user._id.email,
                    api_id: user._id.api_id,
                    createdAt: user._id.createdAt,
                    updatedAt: user._id.updatedAt,
                    is_admin: user._id.is_admin,
                    total_duration: 0,
                    total_duration_formatted: "",
                    projects:[]
                };
                let total_duration = 0;
                _.forEach(user.tasks, function (task) {
                    if (task.status === "Running"){
                        const started_or_last_resumed = task.last_resumed || task.createdAt;
                        total_duration += task.duration + (new Date() - started_or_last_resumed)/1000;
                    }
                    else total_duration += task.duration;
                });
                const total_hours = String(Math.floor(total_duration / 3600)).padStart(2, "0");
                const total_minutes = String(Math.floor((total_duration % 3600) / 60)).padStart(2, "0");
                const total_seconds = String(Math.round((total_duration % 3600) % 60)).padStart(2, "0");

                user_to_send.total_duration = total_duration;
                user_to_send.total_duration_formatted = total_hours + ':' + total_minutes + ':' + total_seconds;

                _.forEach(user.projects, function (project) {

                    let duration = 0;
                    _.forEach(project.tasks, function (task) {
                        if (task.status === "Running"){
                            const started_or_last_resumed = task.last_resumed || task.createdAt;
                            duration += task.duration + (new Date() - started_or_last_resumed)/1000;
                        }
                        else duration += task.duration;
                    });
                    const hours = String(Math.floor(duration / 3600)).padStart(2, "0");
                    const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
                    const seconds = String(Math.round((duration % 3600) % 60)).padStart(2, "0");

                    user_to_send.projects.push({
                        name:project.name,
                        createdAt: project.createdAt,
                        updatedAt: project.updatedAt,
                        total_duration:  duration,
                        formatted_duration: hours + ':' + minutes + ':' + seconds
                    });
                });

                users_to_send.push(user_to_send);
            });
            res.status(200).send(users_to_send);
        }
    });

});


module.exports = router;
