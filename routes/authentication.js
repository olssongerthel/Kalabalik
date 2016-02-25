var helpers = require('../utils/helpers');

exports.login = function(req, res) {
  helpers.authenticate(req.body.username, req.body.password, function(err, user) {

    var response = {
      authenticated: false
    };

    if (err) {
      response.message = err;
    }
    else {
      response.message = 'Login successful';
      response.authenticated = true;
      response.user = user;
      // Delete the password from the user object
      delete response.user['Lösenord'];
    }

    res.status(200).send(response);
  });
};
