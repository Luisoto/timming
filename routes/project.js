/**
 * Created by Luis Soto on 27/10/18.
 */



let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');
let Project = mongoose.model('Project');
let Task = mongoose.model('Task');

let _ = require('lodash');
let Joi = require('joi');

//Endpoint to list all project per user
router.get('/', function(req, res, next) {

    Project.aggregate([
        {
            $match: {
                api_id: req.query.api_id
            },
        },
        {
            $lookup: {
                from: "Task",
                localField: "tasks",
                foreignField: "_id",
                as: "tasks"
            }
        }
    ]).exec(function (err, projects){
        if (err) {
            res.status(500).json({ error: true, message: err });
        }
        else {
            _.forEach(projects, function (project) {
                let duration = 0;
                _.forEach(project.tasks, function (task) {
                    if (task.status === "Running"){
                        const started_or_last_resumed = task.last_resumed || task.createdAt;
                        duration += task.duration + (new Date() - started_or_last_resumed)/1000;
                    }
                    else{
                        duration += task.duration;
                    }
                });
                const hours = String(Math.floor(duration / 3600)).padStart(2, "0");
                const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
                const seconds = String(Math.round((duration % 3600) % 60)).padStart(2, "0");
                project.total_duration = duration;
                project.formatted_duration = hours + ':' + minutes + ':' + seconds;
            });

            res.status(200).send(projects);
        }
    });
});
//Endpoint to create a project
router.post('/', function(req, res, next) {

    const baseSchema = Joi.object().keys({
        name: Joi.string().required(),
        api_id: Joi.string().required()
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        const project_to_save = new Project({
            name: req.body.name,
            api_id: req.user.api_id
        });

        project_to_save.save(function save(err, project) {
            if (err) {
                res.status(500).json({ error: true, message: err });
            } else {
                res.status(200).json(project);
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
//Endpoint to modify a project (Only name)
router.put('/', function (req, res, next) {
    const baseSchema = Joi.object().keys({
        name: Joi.string().required(),
        _id: Joi.string().required().length(24),
        api_id: Joi.string().required()
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {
        Project.findOneAndUpdate({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        },{
            $set: {
                name: req.body.name,
                updatedAt: new Date()
            }
        },{new: true}, function (err, project) {
            if (err){
                res.status(500).json({ error: true, message: err });
            }
            else{
                if (project == null){
                    res.status(404).json({ error: true, message: "Project not found"});
                }
                else {
                    res.status(200).json(project);
                }
            }
        })
    }
    else {
        res.status(400).json({
            error: true,
            errorMessage: validationResult.error.details[0].message
        });
    }
});
//Endpoint to delete a project
router.delete('/', function (req, res, next) {

    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        _id: Joi.string().length(24)
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        Project.deleteOne({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        }).exec(function (err, result) {
            if (err) {
                res.status(500).json({ error: true, message: err });
            }
            else {
                if (result.n === 0){
                    res.status(404).json({ error: true, message: "Project not found"});
                }
                else {
                    res.status(200).json({message: "Project deleted successfully"})
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

router.post('/add_task_to_project', function (req, res, next) {

    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        task_id: Joi.string().required().length(24),
        project_id: Joi.string().required().length(24)
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {

        Project.findOne({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body.project_id)
        }, function (err, project) {
            if (err){
                res.status(500).json({ error: true, message: err });
            }
            else{
                if (project == null){
                    res.status(404).json({ error: true, message: "Project not found"});
                }
                else {
                    Task.findOne({
                        api_id: req.user.api_id,
                        _id: mongoose.Types.ObjectId(req.body.task_id)
                    }).select('api_id').exec(function (err, task) {
                        if (task == null){
                            res.status(404).json({ error: true, message: "Task not found"});
                        }
                        else {
                            //addToSet prevent duplicate task_id
                            Project.findOneAndUpdate({
                                api_id: req.user.api_id,
                                _id: mongoose.Types.ObjectId(req.body.project_id)
                            }, {
                                $set:{
                                  updatedAt: new Date()
                                },
                                $addToSet: {
                                    tasks: task._id
                                },
                            },{new: true},function (err,  new_project) {
                                if (err){
                                    res.status(500).json({ error: true, message: err });
                                }
                                else{
                                    res.status(200).json(new_project);
                                }
                            });
                        }
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


module.exports = router;