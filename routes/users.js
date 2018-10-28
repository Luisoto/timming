/**
 * Created by Luis Soto on 27/10/18.
 */

let express = require('express');
let router = express.Router();
let Joi = require('joi');
let mongoose = require('mongoose');
let User = mongoose.model('_User');
let Task = mongoose.model('Task');
let Project = mongoose.model('Project');

//Endpoint to login
router.get('/', function(req, res, next) {

    /*
    curl -X GET \
      'http://qrvey.aquehorajuega.co:8000/users?email=luisoto92@gmail.com&password=qrvey_test_soto' \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
    */
    //First check if there is a user with provided email
    User.findOne({
        email:req.query.email,
    }).exec(function (err, user) {
        if (err) res.status(500).json({ error: true, message: err });
        else {
            if (user != null){
                //If user exist, compare password with save password in db
                user.verifyPassword(req.query.password, function(err, isMatch ) {
                    if (err) res.status(500).json({ error: true, message: "Cannot login now!" });
                    else if(isMatch === false){
                        res.status(401).json({
                            error:true,
                            message: "Please, verify email and password and try again"
                        });
                    }
                    else {
                        res.status(200).json({api_id : user.api_id})
                    }
                });
            }
            else
            {
                res.status(401).json({
                    error:true,
                    message: "Please, verify email and password and try again"
                });
            }
        }
    });
});
//Endpoint to create user
router.post('/', function(req, res, next) {
    //Schema to validate req.body
    const baseSchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8)
    });
    const data = req.body;
    const validationResult = Joi.validate(data, baseSchema);

    if (!validationResult.error) {
        const user_to_save = new User({
            email:req.body.email,
            password: req.body.password
        });
        user_to_save.save(function save(err, user) {
            if (err) {
                if (err.code = 11000)res.status(500).json({ error: true, message: "Email already registered!" }); //Specific error for duplicate unique key
                else res.status(500).json({ error: true, message: err });
            }
            else res.status(200).json({api_id : user.api_id});
        });
    }
    else{
        res.status(400).json({
            error: true,
            errorMessage: validationResult.error.details[0].message
        });
    }
});
//Endpoint to delete user and all user's task and user's projects by api_id
router.delete('/', function(req, res, next) {
    User.deleteOne({
        api_id:req.user.api_id,
    }).exec(function (err, result) {
        if (err) res.status(500).json({ error: true, message: err });
        else {
            if (result.n === 0)res.status(404).json({ error: true, message: "User not found"});
            else {
                //We have to remove tasks and projects associated to this user
                Project.deleteMany({
                    api_id: req.user.api_id
                }).exec(function (err, result) {
                    Task.deleteMany({
                        api_id: req.user.api_id
                    }).exec(function (err, result) {
                        res.status(200).json({message: "User deleted successfully"});
                    });
                });
            }
        }
    });
});

module.exports = router;
