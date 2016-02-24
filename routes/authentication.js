var helpers = require('../utils/helpers');

exports.login = function(req, res) {
  helpers.authenticate(req.body.username, function(err, user) {
    var response = {
      authenticated: false
    };

    if (err) {
      response.message = 'Login failed';
      response.error = err;
    }
    else if (!req.body.username) {
      response.message = 'Login failed';
      response.error = 'No username supplied.';
    }
    else if (user['Lösenord'] != req.body.password) {
      response.message = 'Login failed';
      response.error = 'Wrong password.';
    }
    else {
      response.message = 'Login successful';
      response.authenticated = true;
      response.user = user;
    }

    res.status(200).send(response);
  });
};
