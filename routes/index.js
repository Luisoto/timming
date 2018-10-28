/**
 * Created by Luis Soto on 27/10/18.
 */



let express = require('express');
let router = express.Router();
const users = require("./users");
const tasks = require("./tasks");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Test qrvey' });
});

module.exports = router;
