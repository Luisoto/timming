const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongo_settings = require("./mongo_settings");

const mongoose = require('mongoose');
let User = mongoose.model('_User');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const taskRouter = require('./routes/tasks');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const auth_user = function(req, res, next) {
    if (req.originalUrl === "/users" && req.method !== "DELETE"){
        next();
    }
    else if (req.body.api_id || req.query.api_id) {

        let api_id = "";
        if (req.query.api_id){
            api_id = req.query.api_id;
        }
        else {
            api_id = req.body.api_id;
        }

        User.findOne({
            api_id: api_id,
        }).exec(function (err, user) {
            if (err) {
                res.status(500).json({ error: true, message: err });
            }
            else {
                if (user != null){
                    req.user = user;
                    next();
                }
                else
                {
                    res.status(401).json({
                        error:true,
                        message: "Please, verify api_id and try again"
                    });
                }
            }
        });
    }
    else{
        res.status(401).send({
            error: true,
            errorMessage: "No api_key provided",
        });
    }
};
app.use('*', auth_user);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tasks', taskRouter);

app.listen(8000, function() {
    console.log('listening on http://localhost:8000');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;
