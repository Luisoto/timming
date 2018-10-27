var express = require('express');
var router = express.Router();
const users = require("./users");
const tasks = require("./tasks");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Test qrvey' });
});

module.exports = router;
