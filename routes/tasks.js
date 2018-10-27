let express = require('express');
let router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
let Task = mongoose.model('Task');


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

router.get('/', function(req, res, next) {
    Task.find({
        api_id: req.query.api_id,
    }).sort({'createdAt': -1}).exec(function (err, tasks) {
        if (err) {
            res.status(500).json({ error: true, message: err });
        }
        else {
            res.status(200).send(tasks);
        }
    });
});

router.post('/', function(req, res, next) {

    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        name: Joi.string(),
        duration: Joi.number()
    }).with("duration", "name");

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        const task_to_save = new Task({api_id: req.user.api_id});

        if (req.body.name != null) task_to_save.name = req.body.name;

        if (req.body.duration != null) {
            task_to_save.status = "Finished";
            task_to_save.duration = req.body.duration;
            task_to_save.finishedAt = new Date();
        }

        task_to_save.save(function save(err, task) {
            if (err) {res.status(500).json({ error: true, message: "Error creating task" })}
            else {
                //Stop last task if it is running (We will only allow one task running at the same time)
                Task.findOne({
                    _id: {$ne: task._id},
                    api_id: req.body.api_id,
                    status: "Running"
                },  function (err, last_task) {
                    if (err) {res.status(500).json({ error: true, message: "Error creating task" })}
                    else {
                        if (last_task != null){
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

    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        _id: Joi.string(),
        status: Joi.any().valid("Running","Paused", "Finished")
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        Task.findOne({
            api_id: req.body.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        }).exec(function (err, task) {
            if (err) {res.status(500).json({ error: true, message: err });}
            else {
                if (task != null){

                    if (req.body.status === "Running"){ //Resume a "Paused" task
                        //Task should be "Paused"
                        if (task.status === "Paused"){
                            task.status = "Running";
                            task.save(function (err, new_task) {
                                if (err){
                                    {res.status(500).json({ error: true, message: err});}
                                }
                                else {
                                    res.status(200).send(new_task)
                                }
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
                        //Task should be "Running"
                        if (task.status === "Running"){
                            task.status = "Paused";
                            task.save(function (err, new_task) {
                                if (err){
                                    {res.status(500).json({ error: true, message: err});}
                                }
                                else {
                                    res.status(200).send(new_task)
                                }
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
                        //Task should be "Running" or "Paused"
                        if (task.status === "Running" || task.status === "Paused"){
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
                else{
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


router.delete('/', function (req, res, next) {
    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        _id: Joi.string()
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        Task.deleteOne({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        }).exec(function (err, result) {
            if (err) {
                res.status(500).json({ error: true, message: err });
            }
            else {
                if (result.n === 0){
                    res.status(404).json({ error: true, message: "Task not found"});
                }
                else {
                    res.status(200).json({message: "Task deleted successfully"})
                }
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
