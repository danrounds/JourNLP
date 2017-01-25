var express = require('express');
var app = express();
app.use(express.static('public')); // /public now serves static files
app.listen(process.env.PORT || 8080);

module.exports = {app};
