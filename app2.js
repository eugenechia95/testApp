var express = require('express');
var app = express();

var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

var fs = require('fs');

var options = {
  root: './app/html',
  headers: {
    'x-timestamp': Date.now(),
    'x-sent': true
  }
};

app.set('port', (process.env.PORT || 3000));

/* serve static files */
app.use(express.static((__dirname, './app')));


//edit limit to avoid 413 error, by default it is only 100kb
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));
app.use(cookieParser());


// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
app.use(flash());


// set the view engine to ejs
app.set('view engine', 'ejs');

var routes = require('./routes/index')();
app.use('/', routes);



// catch 404 - or other error and forward to error handler (?)
app.use(function(err, req, res, next) {

  //doesnt seem to work
  console.log('error' + err.status)

  // render the error page
  res.status(err.status || 500);

  //404 error
  res.sendFile("error.html",options);
});


app.listen(app.get('port'), function() {
  console.log('This app is listening on port 3000!')
})


module.exports = app;
