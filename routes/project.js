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
let general_functions = require("../general_functions");

//Endpoint to list all project per user
router.get('/', function(req, res, next) {
    //Get all list of project with total_duration in seconds and duration formatted
    /*
    curl -X GET \
      'http://qrvey.aquehorajuega.co:8000/projects?api_id=fbe04a90-d9f7-11e8-b610-2d17ef64d214' \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214"
        }'
     */
    //Include all task in each project in same query
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
        if (err) res.status(500).json({ error: true, message: err });
        else {
            //Send with project duration in second and duration formatted
            _.forEach(projects, function (project) {
                const duration = general_functions.formatted_duration_from_tasks(project.tasks);
                project.total_duration = duration.duration;
                project.formatted_duration = duration.formatted;
            });
            res.status(200).send(projects);
        }
    });
});
//Endpoint to create a project
router.post('/', function(req, res, next) {

    /*
    curl -X POST \
      http://qrvey.aquehorajuega.co:8000/projects \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "name": "Test_qrvey"
        }'
     */

    //Schema to validate req.body
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
            if (err) res.status(500).json({ error: true, message: err });
            else res.status(200).json(project);
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
    /*
    curl -X PUT \
      http://qrvey.aquehorajuega.co:8000/projects \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -H 'Postman-Token: 550973b8-5fc9-ef42-02cc-7a17b818d5f3' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "name": "New name",
        "_id": "5bd60c1343445a6f415d14af"
        }'
     */
    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        name: Joi.string().required(),
        _id: Joi.string().required().length(24),
        api_id: Joi.string().required()
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {
        //Look project and then update in same db call
        Project.findOneAndUpdate({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        },{
            $set: {
                name: req.body.name,
                updatedAt: new Date()
            }
        },{new: true}, function (err, project) {
            if (err) res.status(500).json({ error: true, message: err });
            else {
                if (project == null) res.status(404).json({ error: true, message: "Project not found"});
                else res.status(200).json(project);
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

    /*
    curl -X DELETE \
      http://qrvey.aquehorajuega.co:8000/projects \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -H 'Postman-Token: 30c938cb-87af-4708-16f4-13231f68d567' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "_id": "5bd60dfe43445a6f415d14b0"
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

        Project.deleteOne({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body._id)
        }).exec(function (err, result) {
            if (err) res.status(500).json({ error: true, message: err });
            else {
                if (result.n === 0) res.status(404).json({ error: true, message: "Project not found"});
                else res.status(200).json({message: "Project deleted successfully"})
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
    /*
    curl -X POST \
      http://qrvey.aquehorajuega.co:8000/projects/add_task_to_project \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -H 'Postman-Token: 874d854c-e73c-8b90-266a-9c0c20bfbacb' \
      -d '{
        "api_id": "fbe04a90-d9f7-11e8-b610-2d17ef64d214",
        "task_id": "5bd5245607a47b56b3cfdc97",
        "project_id":"5bd5244207a47b56b3cfdc96"
    }'
     */

    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        api_id: Joi.string(),
        task_id: Joi.string().required().length(24),
        project_id: Joi.string().required().length(24)
    });

    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {
        // First we search for project
        Project.findOne({
            api_id: req.user.api_id,
            _id: mongoose.Types.ObjectId(req.body.project_id)
        }, function (err, project) {
            if (err) res.status(500).json({ error: true, message: err });
            else{
                if (project == null) res.status(404).json({ error: true, message: "Project not found"});
                else {
                    //if project exists we search for task
                    Task.findOne({
                        api_id: req.user.api_id,
                        _id: mongoose.Types.ObjectId(req.body.task_id)
                    }).select('api_id').exec(function (err, task) {
                        if (task == null) res.status(404).json({ error: true, message: "Task not found"});
                        else {
                            // If task exists we add task to project using $addToSet because it prevent duplicate task_id in id array
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
                                if (err) res.status(500).json({ error: true, message: err });
                                else res.status(200).json(new_project);
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