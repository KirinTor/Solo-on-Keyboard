const request = require('request');
const assert = require('assert');

const url = 'http://localhost:8888/';

describe ('Status', function() {
    it('checks status', function(done){
        request(url, function(error, response, body) {
          assert.equal(response.statusCode, 200);
          done();
        });
    });
});
