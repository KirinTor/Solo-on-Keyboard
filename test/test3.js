const request = require('request');
const assert = require('assert');
const fs = require("fs");
const cheerio = require('cheerio');

const url = 'http://localhost:8888/';

describe ('Avaliable file for server', function() {
    it('checks if "userpage.html" file avaliable for server requests', function(){
        var htmlSource = fs.readFileSync("./client/userpage.html", "utf8");
        var $ = cheerio.load(htmlSource);
        assert.equal($('title').text(), 'Сторінка користувача');
    });
});
