/**
 * Created by Luis Soto on 27/10/18.
 */



let express = require('express');
let router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
let Task = mongoose.model('Task');
let Project = mongoose.model('Project');
let _ = require('lodash');

//Function to finish a task, It's called when user start another task
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
//Endpoint to get task list
router.get('/', function(req, res, next) {

    //I send a field called formatted_duration this is duration in hours, minutes and seconds,
    // but if another formatted is needed I also send duration in seconds, of this way applications
    // can formatted duration as they needed
    /*
    curl -X GET \
      'http://qrvey.aquehorajuega.co:8000/tasks?api_id=fbe04a90-d9f7-11e8-b610-2d17ef64d214' \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
    */
    Task.find({
        api_id: req.query.api_id,
    }).sort({'createdAt': -1}).exec(function (err, tasks) {
        if (err) res.status(500).json({ error: true, message: err });
        else res.status(200).send(tasks);
    });
});
//Endpoint to create a task (manually or from applications)
router.post('/', function(req, res, next) {

    //Task duration must be in seconds, for me is better because we don't need split strings or received a large json
    // for hours, minutes and seconds
    /*
    curl -X POST \
      http://qrvey.aquehorajuega.co:8000/tasks \
          -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214"
    }'
    */

    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        name: Joi.string(),
        duration: Joi.number()
    }).with("duration", "name"); // If duration is provided user should send task name

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        const task_to_save = new Task({api_id: req.user.api_id});

        if (req.body.name != null) task_to_save.name = req.body.name;

        //Manual task will be saved as Finished
        if (req.body.duration != null) {
            task_to_save.status = "Finished";
            task_to_save.duration = req.body.duration;
            task_to_save.finishedAt = new Date();
        }

        task_to_save.save(function save(err, task) {
            if (err) {res.status(500).json({ error: true, message: "Error creating task" })}
            else {
                //If user start another task last "Running" task should be marked as "Finished"
                if (req.body.duration == null){
                    //Stop last task if it is running (We will only allow one task running at the same time)
                    Task.findOne({
                        _id: {$ne: task._id}, //This is because we don't want to mark current task as Finished
                        api_id: req.body.api_id,
                        status: "Running"
                    },  function (err, last_task) {
                        if (err) {res.status(500).json({ error: true, message: "Error creating task" })}
                        else {
                            if (last_task != null){ //If there is running task call function to finish task
                                let promise_result = finish_task(last_task).then(function (result) {
                                    res.status(200).json(task);
                                });
                                promise_result['catch'](function(){
                                    Task.deleteOne(task).then(res.status(500).json({ error: true, message: "Error creating task" }))
                                });
                            }
                            else {
                                res.status(200).json(task)
                            }
                        }
                    });
                }
                else{ //If user create a manual task last running task should continue as running
                    res.status(200).json(task)
                }
            }
        });
    }
    else {
        res.status(400).json({
            error: true,
            errorMessage: validationResult.error.details[0].message
        });
    }
});
//Modified a task (Resume, Stop or Finish)
router.put('/', function (req, res, next) {

    //Application should send new status and according to this status duration is calculated
    /*
    curl -X PUT \
      http://qrvey.aquehorajuega.co:8000/tasks \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "_id":"5bd482226da4590f76f6e982",
        "status": "Paused"
    }'
    */
    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        _id: Joi.string().length(24),
        status: Joi.any().valid("Running","Paused", "Finished")
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        //Search task user want modified
        Task.findOne({
            api_id: req.body.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        }).exec(function (err, task) {
            if (err) {res.status(500).json({ error: true, message: err });}
            else {
                if (task != null){

                    if (req.body.status === "Running"){ //Resume a "Paused" task
                        //Task must be "Paused" in order to resume
                        if (task.status === "Paused"){
                            task.status = "Running"; //Mark task as "Running"
                            task.save(function (err, new_task) {
                                if (err) res.status(500).json({ error: true, message: err});
                                else res.status(200).send(new_task)
                            })
                        }
                        else{
                            res.status(400).json({
                                error: true,
                                message: "You cannot resume a task that is already running or finished"
                            })
                        }
                    }
                    else if (req.body.status === "Paused"){ //Paused a running task
                        //Task should be "Running" in order to Paused
                        if (task.status === "Running"){
                            task.status = "Paused"; //Mark task as "Paused"
                            task.save(function (err, new_task) {
                                if (err) res.status(500).json({ error: true, message: err});
                                else res.status(200).send(new_task)

                            })
                        }
                        else{
                            res.status(400).json({
                                error: true,
                                message: "You cannot paused a task that is already paused or finished"
                            })
                        }
                    }
                    else{
                        //Task should be "Running" or "Paused" in order to finished
                        if (task.status === "Running" || task.status === "Paused"){
                            //Call function to finish a task
                            let promise_result = finish_task(task).then(function (result) {
                                res.status(200).json(task);
                            });
                            promise_result['catch'](function(){
                                res.status(500).json({ error: true, message: "Error finishing task" });
                            });
                        }
                        else{
                            res.status(400).json({
                                error: true,
                                message: "You cannot finish a task that is already finished"
                            })
                        }
                    }
                }
                else{ // Send error if task is not found
                    res.status(404).json({
                       error: true,
                       message: "Task not found"
                    });
                }
            }
        });
    }
    else {
        res.status(400).json({
            error: true,
            errorMessage: validationResult.error.details[0].message
        });
    }

});
//Endpoint to delete a task
router.delete('/', function (req, res, next) {

    //Application should send task_id(_id) in order to delete a specific task
    /*
    curl -X DELETE \
      http://qrvey.aquehorajuega.co:8000/tasks \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "_id": "5bd4fbc97aa1b54d982ce19c"
    }'
    */
    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        _id: Joi.string().length(24)
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        //First remove task from projects
        Project.updateMany({
            api_id:req.user.api_id,
            tasks: mongoose.Types.ObjectId(req.body._id)
        },{
            $pull:{
                tasks: mongoose.Types.ObjectId(req.body._id)
            }
        },{ multi: true }, function (err, projects) {
            if (err) res.status(500).json({ error: true, message: err });
            else {
                //Now that task is removed from all project we can delete that object
                Task.deleteOne({
                    api_id: req.user.api_id,
                    _id: mongoose.Types.ObjectId(req.body._id)
                }).exec(function (err, result) {
                    if (err) res.status(500).json({ error: true, message: err });
                    else {
                        if (result.n === 0)res.status(404).json({ error: true, message: "Task not found"});
                        else res.status(200).json({message: "Task deleted successfully"});
                    }
                });
            }
        });
    }
    else{
        res.status(400).json({
            error: true,
            errorMessage: validationResult.error.details[0].message
        });
    }
});

module.exports = router;
