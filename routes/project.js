let express = require('express');
let router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
let Project = mongoose.model('Project');

//Endpoint to list all project per user
router.get('/', function(req, res, next) {
    Project.find({
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
// Endpoint to create a project
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

module.exports = router;