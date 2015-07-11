/*
  module flakes - чешуйки
*/

var _ = require('underscore');
var util = require('util');
var s = require('sandhi');
var c = s.const;
var u = s.u;
var sandhi = s.sandhi;
var log = u.log;

var salita = require('salita-component'); // FIXME: это нужно убрать
var debug = (process.env.debug == 'true') ? true : false;

module.exports = flakes();

function flakes() {
    if (!(this instanceof flakes)) return new flakes();
    return this;
}

flakes.prototype.scrape = function(samasa) {
    log('FLAKES SCRAPED', samasa);
    return 'here will be many flakes';
}
