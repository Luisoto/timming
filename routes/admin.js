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
let general_functions = require("../general_functions");

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

    //List all users with total spent and total spend per project
    /*
    curl -X GET \
      'http://qrvey.aquehorajuega.co:8000/admin?api_id=fbe04a90-d9f7-11e8-b610-2d17ef64d214' \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -H 'Postman-Token: 30b666fa-06a5-a48d-e7a4-bff145d0da0f'
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
            $lookup: {
                from: "Task",
                localField: "api_id",
                foreignField: "api_id",
                as: "tasks"
            }
        }

    ]).exec(function (err, users){
        if (err) res.status(500).json({ error: true, message: err });
        else {
            let users_to_send = [];
            _.forEach(users, function (user) {

                let user_to_send = {
                    _id: user._id,
                    email: user.email,
                    api_id: user.api_id,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    is_admin: user.is_admin,
                    projects:[]
                };

                const total_duration = general_functions.formatted_duration_from_tasks(user.tasks);

                user_to_send.total_duration = total_duration.duration;
                user_to_send.total_duration_formatted = total_duration.formatted;

                _.forEach(user.projects, function (project) {
                    let task_in_project = [];
                    _.forEach(project.tasks, function (task_id) {
                        task_in_project.push(_.find(user.tasks, {"_id":task_id}));
                    });
                    const duration = general_functions.formatted_duration_from_tasks(task_in_project);
                    user_to_send.projects.push({
                        name:project.name,
                        createdAt: project.createdAt,
                        updatedAt: project.updatedAt,
                        total_duration:  duration.duration,
                        formatted_duration: duration.formatted
                    });
                });

                users_to_send.push(user_to_send);
            });
            res.status(200).send(users_to_send);
        }
    });
});


module.exports = router;
