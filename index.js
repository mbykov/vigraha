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

/*
  получает что? stems или tail?
  // scraper должет возвращать массив {pos: number, flake: 'string', vows: vows, sutra: sutra}
  пока только {pos:0, flakes: ['a', 'ab', 'abc']}
*/

flakes.prototype.scrape = function(samasa) {
    var syms = samasa.split('');
    log('syms', syms);
    var start = 0;
    var size = 1;
    var vows = 0;
    var flake, flakearr, beg;
    while (vows <= 5) {
        flakearr = syms.slice(start, size);
        beg = flakearr[0];
        flake = flakearr.join('');
        log('F', flake)
        size++;
        vows++;
    }
    return true;
}







flakes.prototype.shredder = function(tail) {
    log('FLAKES SCRAPED', tail);
    return 'here will be many flakes';
}
