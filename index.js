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

  ==============
  вопрос: что откидывать? tail должен начинаться с согласной?


*/

flakes.prototype.scrape = function(rawsamasa) {
    var total = rawsamasa.length;
    var flakes = [];
    // log('syms', totsyms);
    var samasa = rawsamasa;
    var pos = 0;
    var beg;
    while (pos < total) {
        samasa = rawsamasa.slice(pos);
        beg = u.first(samasa);
        pos++;
        if (!u.isConsonant(beg) && !u.isVowel(beg)) continue;
        log('S', pos, samasa);
        flakes.push(cutTail(samasa, pos));
    }
    return flakes;
}


function cutTail(samasa, pos) {
    var flakes = [];
    var flakesize = 0;
    var vows = 0;
    var flake, rawtail, res;
    var firsts = [];
    while (vows < 5) {
        flakesize++;
        vows++;
        flake = samasa.slice(0, flakesize);
        if (flake == samasa) continue;
        // log('FLAKE', 'pos', pos, 's', samasa.length, 'fsize', flakesize, 's.size+f.size',  samasa.length+flakesize, 'fl', flake)
        vows = vowCount(flake);
        // log('V', vows);
        rawtail = samasa.slice(flakesize);
        beg = rawtail[0];
        // log('====== F', flake, 'T', rawtail, 'B', beg, '========');
        if (!u.isConsonant(beg)) continue;
        res = sandhi.del(samasa, rawtail);
        // // log('R', res)
        // if (res.length == 0) continue;
        // // res.forEach(function(r) { r.flake = flake});
        // firsts = res.map(function(r) { return r.firsts});
        // firsts = _.uniq(_.flatten(firsts));
        // // log('FF', firsts)
        // flakes.push({pos: pos, flakes: firsts});
    }
    return flakes;
}


function vowCount(flake) {
    var syms = flake.split('');
    var beg = syms[0];
    var vows = (u.isVowel(beg)) ? 1 : 0;
    syms.forEach(function(s) {
        if (u.isConsonant(s)) vows+=1;
        else if (s == c.virama) vows-=1;
    });
    return vows;
}

function _vowCount(str) {
    var syms = str.split('');
    var vows = (u.c(c.allvowels, syms[0])) ? 1 : 0;
    syms.forEach(function(s) {
        if (u.c(c.hal, s)) vows+=1;
        else if (c.virama == s) vows-=1;
    });
    return vows;
}



flakes.prototype.shredder = function(tail) {
    log('FLAKES SCRAPED', tail);
    return 'here will be many flakes';
}
