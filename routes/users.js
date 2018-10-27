let express = require('express');
let router = express.Router();
const Joi = require('joi');

const mongoose = require('mongoose');
let User = mongoose.model('_User');

//Login
router.get('/', function(req, res, next) {
    User.findOne({
        email:req.query.email,
    }).exec(function (err, user) {
        if (err) {
            res.status(500).json({ error: true, message: err });
        }
        else {
            if (user != null){
                user.verifyPassword(req.query.password, function(err, isMatch ) {
                    if (err) {
                        res.status(500).json({ error: true, message: "Cannot login now!" });
                    }
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
//Create
router.post('/', function(req, res, next) {

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
                if (err.code = 11000){
                    res.status(500).json({ error: true, message: "Email already registered!" });
                }
                else{
                    res.status(500).json({ error: true, message: "Error creating user" });
                }
                console.log(err);
            } else {
                res.status(200).json({api_id : user.api_id});
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
//Delete user and all task and projects by api_id
router.delete('/', function(req, res, next) {

    User.deleteOne({
        api_id:req.user.api_id,
    }).exec(function (err, result) {
        if (err) {
            res.status(500).json({ error: true, message: err });
        }
        else {
            if (result.n === 0){
                res.status(404).json({ error: true, message: "User not found"});
            }
            else {
                //We should remove tasks and projects
                res.status(200).json({message: "User deleted successfully"})
            }
        }
    });
});

module.exports = router;
