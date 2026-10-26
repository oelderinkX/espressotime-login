const express = require('express');
const app = express();
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser')
const useragent = require('express-useragent');
const port = process.env.PORT || 80;

console.log('espress time login port number is: ' + port);

app.use(favicon(__dirname + '/images/favicon.ico'));

app.disable('etag');

app.use(cookieParser());
app.use(useragent.express());
app.use('/images', express.static('images'));
app.use('/script', express.static('script'));
app.use('/webpage', express.static('webpage'));
app.use('/javascript', express.static('javascript'));

app.listen(port, function () {
	console.log('Login server is ready!');
});

require('./srv/login.js')(app);
require('./srv/registration.js')(app);

