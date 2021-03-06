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

module.exports = vigraha();

function vigraha() {
    if (!(this instanceof vigraha)) return new vigraha();
    return this;
}

/*
*/

vigraha.prototype.scrape = function(rawsamasa) {
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
        flakes.push(res);
    }

    // return [];
    return flakes;
}

vigraha.prototype.pdchs = function(samasa) {
    var that = this;
    var salat = salita.sa2slp(samasa);
    var pdchs = [];

    function getPada(samasa, pdch) {
        var cuttedByPos = that.scrape(samasa);
        cuttedByPos.forEach(function(flakes, idx) {
            flakes.forEach(function(flake, idy) {
                flake.firsts.forEach(function(first, idz) {
                    if (first.length == 1 && !inc(['च', 'न', 'स', 'ॐ'], first)) return;
                    // if (syllables(first) < 2) return;
                    // if (syllables(first) > 5) return;
                    pdch.push(first);
                    if (flake.seconds.length == 0) {
                        var clone = JSON.parse(JSON.stringify(pdch));
                        pdchs.push(clone);
                    }
                    flake.seconds.forEach(function(second, idw) {
                        // if (syllables(second) < 3) return;
                        getPada(second, pdch);
                    }); // second
                    pdch.pop();
                }); // first
            });
        });
    }
    getPada(samasa, []);
    // if (pdchs.length < 20)
    // p(pdchs);
    // log('pdchs size:', salat, samasa, samasa.length, '-->', pdchs.length)
    // return [];
    return pdchs;
}


function syllables(flake) {
    var syms = flake.split('');
    var beg = syms[0];
    var vows = (u.isVowel(beg)) ? 1 : 0;
    syms.forEach(function(s) {
        if (u.isConsonant(s)) vows+=1;
        else if (s == c.virama) vows-=1;
    });
    return vows;
}
