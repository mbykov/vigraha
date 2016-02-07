/*
  module flakes - чешуйки
*/

var _ = require('underscore');
var util = require('util');
var s = require('sandhi');
var c = s.const;
var u = s.u;
var sandhi = s.sandhi;
var inc = u.include;
var log = u.log;
var p = u.p;

var salita = require('salita-component'); // FIXME: это нужно убрать
var debug = (process.env.debug == 'true') ? true : false;

// FIXME: это временно, потом перенести в morph-0.3
dbpath = 'http://localhost:5984';
var Relax = require('relax-component');
var relax = new Relax(dbpath);
relax.dbname('gita');

module.exports = rasper();

function rasper() {
    if (!(this instanceof rasper)) return new rasper();
    return this;
}

/*
*/

rasper.prototype.scrape = function(rawsamasa) {
    var total = rawsamasa.length+1;
    var flakes = [];
    // var flake = {};
    var samasa = rawsamasa;
    var pos = 0;
    var beg;
    var res;
    while (pos < total) {
        samasa = rawsamasa.slice(pos);
        beg = u.first(samasa);
        log('R', rawsamasa, 'S', samasa, 'B', beg);
        pos++;
        if (beg && !u.isConsonant(beg)) continue;
        // if (rawsamasa == samasa) continue;
        var res = sandhi.del(rawsamasa, samasa);
        log('R', res)
        res.forEach(function(result) {
            result.tails = result.seconds.map(function(second) { return cutTail(second)});
        });
        // if (res.length == 0) continue; // откуда это?
        if (res.length == 0) {
            log('======================>>>>>>>> ZERO RES', rawsamasa, 'samasa:', samasa, rawsamasa == samasa);
            continue;
        }
        // if (res[0].num) continue; // это samasa == second, уродство, выкинуть в sandhi?
        flakes.push(res);
    }
    flakes = _.flatten(flakes);
    // return [];
    return flakes;
}

// возвращает second, разрезанный на массив firsts
// путается flakes тут и в .scrape
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
    flakes = _.uniq(_.flatten(flakes)); // FIXME: это не работает
    return flakes;
}

/*
  простой перебор:
  первая пада - к ней tails, сколько есть
  firsrt + tail - равнятется одному из последующий firsts (м.б. нет в словаре, это ok)
  но - нужный first искать придется по начало...хвост, то есть без гласных в конце first и начале tail
  к этой частичной паде - опять все tails, сколько есть
  затем для полученной последовательности вычисляется вес
  ==
  обозримо
  2. создать спец. БД для тестов гиты, потому что в couch/sa может не быть нужного stem-а, а заниматься слиянием баз сейчас не с руки, и недолго
*/


rasper.prototype.vigraha_ = function(samasa) {
    var flakes = this.scrape(samasa);
    var pdchs = [];
    var flakefirsts = flakes.map(function(flake) { return flake.firsts});
    flakefirsts = _.uniq(_.flatten(flakefirsts));
    // log('Fs', flakefirsts);
    var pada = getPada(flakes, flakefirsts, 0, 0, 0, 0);
    pdchs.push(pada);
    log('size', samasa.length, '-->', pdchs.length)
    return 'ku'
}

function getPada(flakes, flakefirsts, idx, idy, idz, idw) {
    var step = [idx, idy, idz, idw].join('-');
    log('step', step);
    var pdchs = [];
    var flake = flakes[idx];
    var first = flake.firsts[idy];
    var tail = flake.tails[idz];
    var second = tail[idw];

    var cfirst = first.slice(0, -1);
    var csecond = u.wofirstIfVow(second);
    var newfirst = _.find(flakefirsts, function(f) { return u.startsWith(f, cfirst) && u.endsWith(f, csecond)});
    var newflake = _.find(flakes, function(f) {return inc(f.firsts, newfirst)});
    return step;
}

rasper.prototype.vigraha = function(samasa) {
    var flakes = this.scrape(samasa);
    var flakefirsts = flakes.map(function(flake) { return flake.firsts});
    flakefirsts = _.uniq(_.flatten(flakefirsts));
    log('Fs', flakefirsts);
    var pdchs = [];
    flakes.forEach(function(flake, idx) {
        var firsts = flake.firsts;
        firsts = _.uniq(firsts);
        firsts.forEach(function(first, idy) {
            // log('FIRST', first);
            log('IDX', idx, idy)
            var tails = flake.tails;
            // var complete = false;
            var pdch = [idx, idy, first];
            function getPada(first, tails) {
                // if (!tails) log('NO TAILS', first);
                tails.forEach(function(tail, idz) {
                    // log(tail)
                    tail.forEach(function(second, idw) {
                        var cfirst = first.slice(0, -1);
                        var csecond = u.wofirstIfVow(second); // FIXME: S-cC case?
                        // log('CF', cfirst, 'CS', csecond);
                        // log('CF', cfirst, 'CS', csecond);
                        var newfirst = _.find(flakefirsts, function(f) { return u.startsWith(f, cfirst) && u.endsWith(f, csecond)});
                        // log('NWE FIRST', newfirst);
                        if (!newfirst) return;
                        pdch.push(second);
                        // if (newfirst) log('F', first, 'CF', cfirst, 'CS', csecond, '=NF=', newfirst);
                        if (!newfirst) return;
                        var newflake = _.find(flakes, function(f) {return inc(f.firsts, newfirst)});
                        var newtails = newflake.tails;
                        if (!newtails) log('NO TAILS', newflake);
                        getPada(newfirst, newtails);
                    });
                    pdch.push(1111);
                    // if (pdch[2] == 'योग') log('=================888', pdch)
                    pdchs.push(pdch);
                    pdch = ['A', '-', first];
                    // return pdch;
                });
                // pdch.push(2222);
                // pdchs.push(pdch);
                // pdch = ['B', '-', first];
                // return pdch;
            }
            getPada(first, tails);
            // pdchs.push(res);
        });
    });
    // p(pdchs.slice(-26));
    pdchs.forEach(function(pdch) {
        if (pdch[2] == 'योग') log('===========>>>', pdch)
    });
    log('size', samasa.length, '-->', pdchs.length)
    return;
}

function getPada_(pdchs, pdch, flakes, flakefirsts, first, tails) {
    // if (!tails) log('NO TAILS', first);
    tails.forEach(function(tail, idz) {
        // log(tail)
        tail.forEach(function(second, idw) {
            var cfirst = first.slice(0, -1);
            var csecond = u.wofirstIfVow(second); // FIXME: S-cC case?
            // log('CF', cfirst, 'CS', csecond);
            var newfirst = _.find(flakefirsts, function(f) { return u.startsWith(f, cfirst) && u.endsWith(f, csecond)});
            // log('NWE FIRST', newfirst);
            pdch.push(second);
            // if (newfirst) log('F', first, 'CF', cfirst, 'CS', csecond, '=NF=', newfirst);
            if (!newfirst) return;
            var newflake = _.find(flakes, function(f) {return inc(f.firsts, newfirst)});
            var newtails = newflake.tails;
            if (!newtails) log('NO TAILS', newflake);
            getPada(pdchs, pdch, flakes, flakefirsts, newfirst, newtails);
        });
        pdch.push(1111);
        if (pdch[0] == 8) log('=================888', tail)
        // pdchs.push(pdch);
        // pdch = ['A'];
        // return pdch;
    });
    // return pdch;
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
