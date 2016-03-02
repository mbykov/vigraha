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
        pos++;
        // if (beg && !u.isConsonant(beg)) continue;
        if (beg && ! (u.isConsonant(beg) || beg == c.M)) continue;
        // if (rawsamasa == samasa) continue;
        // log('pos', pos, 'R', rawsamasa, 'S', samasa, 'B', beg);
        var res = sandhi.del(rawsamasa, samasa);
        // log('R=', res);
        if (!res || res.length == 0) {
            // log('======================>>>>>>>> ZERO RES', rawsamasa, 'samasa:', samasa, rawsamasa == samasa);
            continue;
        }
        // res.forEach(function(result) {
            // result.tails = result.seconds.map(function(second) { return cutTail(second)});
        // });
        // if (res.length == 0) continue; // откуда это?
        // if (pos == 7) res = res.slice(0,2);
        // log('R', pos, res)
        // if (res[0].num) continue; // это samasa == second, уродство, выкинуть в sandhi?
        // var key = res.map(function(result) { return _.uniq(result.firsts).join('-')});
        flakes.push(res);
    }

    // flakes = _.flatten(flakes);
    // flakes = flakes.map(function(flake, idx) {
    //     flake.idx = idx;
    //     return flake;
    // });
    // return [];
    return flakes;
}

rasper.prototype.cut = function(samasa) {
    var salat = salita.sa2slp(samasa);
    var cuttedByPos = this.scrape(samasa);

    var pdchs = [];
    cuttedByPos.forEach(function(flakes, idx) {
        // log('========================= FLAKES:', idx, flakes);
        flakes.forEach(function(flake, idy) {
            // log('========================= FLAKE:', flake);
            flake.firsts.forEach(function(afirst, idz) {
                // log('========================= AFIRST:', afirst);
                var pdch = [afirst];
                flake.seconds.forEach(function(asecond, idw) {
                    log('========================= AFIRST:', afirst, 'asec:', asecond);

                });

            });

        });
    });

    log('pdchs size:', salat, samasa, samasa.length, '-->', pdchs.length)
    return [];
    // return pdchs;
}


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
