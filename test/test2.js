const request = require('request');
const assert = require('assert');
const cheerio = require('cheerio');

const url = 'http://localhost:8888/';

describe ('Get page from server', function() {
    it('checks if user gets authorisation page', function(done){
        request(url, function(error, response, body) {
          var $ = cheerio.load(body);
          assert.equal($('title').text(), 'Авторизація');
          done();
        });
    });
});
