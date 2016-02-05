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
    var flake = {};
    // log('syms', totsyms);
    var samasa = rawsamasa;
    var pos = 0;
    var beg;
    var res;
    while (pos < total) {
        samasa = rawsamasa.slice(pos);
        beg = u.first(samasa);
        pos++;
        // if (!u.isConsonant(beg) && !u.isVowel(beg)) continue;
        if (!u.isConsonant(beg)) continue;
        // pos--;
        // samasa = firstLiga2vow(samasa); // TODO: FIXME: неясно, м.б. оставить лигу? Все равно складывать лигу потом
        log('S', pos, samasa);
        var res = sandhi.del(rawsamasa, samasa);
        // var tails;
        res.forEach(function(result) {
            log('RES', result);
            result.tails = result.seconds.map(function(second) { return cutTail(second)});
        });
        // res.tails = tails;
        // firsts = cutTail(samasa);
        // firsts = _.uniq(_.flatten(firsts));
        // log('FFF', firsts)
        // flakes.push({pos: pos, flakes: firsts});
        flakes.push(res);
        // pos++;
    }
    return flakes;
}

// возвращает массив firsts, pos - удалил
function cutTail(samasa, pos) {
    // if (pos !=6) return;
    var flakes = [];
    var cutpos = 0;
    var vows = 0;
    var flake, rawtail, res;
    var firsts = [];
    while (cutpos < 8) {
        vows++;
        flake = samasa.slice(0, cutpos);
        // vows = vowCount(flake);
        // if (flake == samasa) continue;
        // log('FLAKE', s', samasa.length, 'fsize', cutpos, 's.size+f.size',  samasa.length+cutpos, 'fl', flake)
        // log('V', vows);
        rawtail = samasa.slice(cutpos);
        beg = rawtail[0];
        // log('====== samasa', samasa, 'Flake', flake, 'Tail', rawtail, 'B', beg, '========');
        cutpos++;
        if (beg && !u.isConsonant(beg)) continue;
        res = sandhi.del(samasa, rawtail);
        // log('R', res)
        if (!res) continue;
        if (res.length == 0) continue;
        // // res.forEach(function(r) { r.flake = flake});
        firsts = res.map(function(r) { return r.firsts});
        firsts = _.uniq(_.flatten(firsts));
        // // log('FF', firsts)
        flakes.push(firsts);
    }
    flakes = _.uniq(_.flatten(flakes));
    return flakes;
}

function firstLiga2vow(str) {
    var beg = str[0];
    if (u.c(c.allligas, beg)) {
        beg = u.vowel(beg);
        str = u.wofirst(str);
        str = [beg, str].join('');
    }
    return str;
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



flakes.prototype.shredder = function(tail) {
    log('FLAKES SCRAPED', tail);
    return 'here will be many flakes';
}
