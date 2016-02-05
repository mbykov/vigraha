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

module.exports = rasper();

function rasper() {
    if (!(this instanceof rasper)) return new rasper();
    return this;
}

/*
*/

rasper.prototype.scrape = function(rawsamasa) {
    var total = rawsamasa.length;
    var flakes = [];
    // var flake = {};
    var samasa = rawsamasa;
    var pos = 0;
    var beg;
    var res;
    while (pos < total) {
        samasa = rawsamasa.slice(pos);
        beg = u.first(samasa);
        pos++;
        if (!u.isConsonant(beg)) continue;
        // if (rawsamasa == samasa) continue;
        var res = sandhi.del(rawsamasa, samasa);
        res.forEach(function(result) {
            result.tails = result.seconds.map(function(second) { return cutTail(second)});
        });
        if (res[0].num) continue; // это samasa == second, уродство, выкинуть в sandhi?
        flakes.push(res);
    }
    return flakes;
}

// возвращает second, разрезанный на массив firsts
function cutTail(samasa) {
    // if (pos !=6) return;
    var flakes = [];
    var cutpos = 0;
    var vows = 0;
    var flake, rawtail, res;
    var firsts = [];
    while (cutpos < 8) {
        vows++;
        flake = samasa.slice(0, cutpos);
        rawtail = samasa.slice(cutpos);
        beg = rawtail[0];
        // log('====== samasa', samasa, 'Flake', flake, 'Tail', rawtail, 'B', beg, '========');
        cutpos++;
        if (beg && !u.isConsonant(beg)) continue;
        // if (samasa, rawtail) continue;
        res = sandhi.del(samasa, rawtail);
        if (!res) continue;
        if (res.length == 0) continue; // ???
        firsts = res.map(function(r) { return r.firsts});
        firsts = _.uniq(_.flatten(firsts));
        flakes.push(firsts);
    }
    flakes = _.uniq(_.flatten(flakes));
    return flakes;
}

/*
  водопад. Выбрать из flakes последовательность, максимально заполняющую samasa
  кидаю сверху - первая пада длиннейшая
  дальше неясно
  ===
  зато есть простой перебор:
  первая пада - к ней tails, сколько есть
  firsrt + tail - равнятется одному из последующий firsts (м.б. нет в словаре, это ok)
  но - нужный first искать придется по начало...хвост, то есть без гласных в конце first и начале tail
  к этой частичной паде - опять все tails, сколько есть
  затем для полученной последовательности вычисляется вес
  ==
  обозримо
*/


rasper.prototype.vigraha = function(samasa) {
    var flakes = this.scrape(samasa)
    log(1, flakes);
    return;
}











// function firstLiga2vow(str) {
//     var beg = str[0];
//     if (u.c(c.allligas, beg)) {
//         beg = u.vowel(beg);
//         str = u.wofirst(str);
//         str = [beg, str].join('');
//     }
//     return str;
// }


// function vowCount(flake) {
//     var syms = flake.split('');
//     var beg = syms[0];
//     var vows = (u.isVowel(beg)) ? 1 : 0;
//     syms.forEach(function(s) {
//         if (u.isConsonant(s)) vows+=1;
//         else if (s == c.virama) vows-=1;
//     });
//     return vows;
// }
