/*
  module flakes - чешуйки
  старый вариант, рекурсия требует sandhi.add
  удобно для полной проверки sandhi.js, но медленно
  сейчас make gita вызывает как раз этот вариант
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
    var uflakes = {}; // FIXME: с не-уникальностью нужно разобраться, откуда она берется? tvidametezAm - tvidama idx=4 и idx=6
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
        res.forEach(function(result) {
            result.tails = result.seconds.map(function(second) { return cutTail(second)});
        });
        // if (res.length == 0) continue; // откуда это?
        // if (pos == 7) res = res.slice(0,2);
        // log('R', pos, res)
        // if (res[0].num) continue; // это samasa == second, уродство, выкинуть в sandhi?
        // var key = res.map(function(result) { return _.uniq(result.firsts).join('-')});
        // if (!uflakes[key]) uflakes[key] = res;
        flakes.push(res);
    }
    // flakes = _.values(uflakes);
    flakes = _.flatten(flakes);
    flakes = flakes.map(function(flake, idx) {
        flake.idx = idx;
        return flake;
    });
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
    var size = samasa.length+1;
    // log('SIZE', samasa.length)
    while (cutpos < size) {
        vows++;
        flake = samasa.slice(0, cutpos);
        rawtail = samasa.slice(cutpos);
        cutpos++;
        // if (rawtail.length < 1) continue;
        beg = rawtail[0];
        // log('====== samasa', samasa, 'Flake', flake, 'Tail', rawtail, 'B', beg, '========');
        // log('====== beg', beg, beg == c.M, '========');
        if (beg && ! (u.isConsonant(beg) || beg == c.M)) continue;
        // if (samasa, rawtail) continue;
        res = sandhi.del(samasa, rawtail);
        // log('R', cutpos, 'samasa', samasa, 'rawt', rawtail, 'res', res);
        if (!res) continue;
        if (res.length == 0) continue; // ???
        firsts = res.map(function(r) { return r.firsts});
        firsts = _.uniq(_.flatten(firsts));

        firsts = _.select(firsts, function(f) { return inc(['च', 'न', 'स'], f) || f.length > 1}); // longer than 1
        flakes.push(firsts);
    }
    flakes = _.uniq(_.flatten(flakes)); // FIXME: это не работает - почему?
    // TODO: здесь проверить на двойную согласную в конце слова, две вирамы, в конце и третья с конца
    return flakes;
}

rasper.prototype.cut = function(samasa) {
    var flakes = this.scrape(samasa);
    // var flakefirsts = flakes.map(function(flake) { return flake.firsts});
    // flakefirsts = _.uniq(_.flatten(flakefirsts));
    // log('Fs', flakefirsts);
    var salat = salita.sa2slp(samasa);

    var pdchs = [];
    flakes.forEach(function(flake, idx) {
        var firsts = flake.firsts;
        firsts = _.uniq(firsts);
        // log('=========================FIRSTS:', firsts);
        firsts.forEach(function(afirst, idy) {
            // log('IDX', idx, idy)
            var tails = flake.tails;
            tails.forEach(function(atail, idz) {
                // if (afirst == 'विगतेच्छा') log('=========================FIRST:', afirst, 'atail', atail);
                atail.forEach(function(asecond, idw) {

                    // log('start flake:', idx, idy, 'afirst:', afirst, 'tails', idz, idw, 'asecond:', asecond);
                    // if (afirst == 'विगतेच्छा') log('f', afirst, 's', asecond)

                    var pdch = [afirst];
                    function getPada(first, second, depth) {
                        if (!pdch) return;
                        depth++;
                        // if (depth > 5) return;
                        pdch.push(second);
                        // if (first == 'विगतेच्छा' && second == 'भय') log('==> f:', first, 's:', second, 'd:', depth)

                        var newfirst;
                        var newtails = [];
                        var res = sandhi.add(first, second);
                        var addres = res.map(function(r) { return r.samasa});

                        // if (first == 'विगत' && second == 'इच्छा')  log('ADD RES', addres, 111, afirst, asecond);
                        // selecting next-level flake:
                        var inter;
                        var oks = []; // suitable, good flakes
                        flakes.forEach(function(flake, idx_) {
                            var firsts = flake.firsts;
                            firsts = _.uniq(firsts);
                            inter = _.intersection(firsts, addres);
                            if (inter.length > 0) {
                                // log('INTER', 'firsts:', firsts, 'addres:', addres, 'f:', first, 's:', second, 'inter:', inter)
                                newfirst = addres;
                                if (inter.length == 1) newfirst = inter[0];
                                else {
                                    log('INTER >1: afirst', afirst, 'asecond', asecond, 'first', first, 'second', second, 'addres', addres);
                                    throw new Error('BAD INTERSECTION');
                                }
                                newtails = flake.tails;
                                if (inter.length == 1) oks.push(flake);
                                // return;
                            } else {
                                // if (first == 'विगतेच्छा' && second == 'भय') log('NO INTERSECTION')
                            }
                        });
                        /*
                          значит, нужно выбирать ВСЕ подходящие flakes и объединять tails ?
                          или - еще один цикл по подходящим flakes ?
                        */
                        // newtails = oks.map(function(f) { return f.tails });
                        newtails = [];
                        oks.forEach(function(f) {
                            // if (first == 'विगत' && second == 'इच्छा') log(f)
                            f.tails.forEach(function(tail) {
                                // if (first == 'विगत' && second == 'इच्छा') log(tail);
                                newtails.push(tail);
                            });

                        });

                        // if (first == 'विगत' && second == 'इच्छा') p('NEWFIRST', oks);
                        // if (first == 'विगत' && second == 'इच्छा') log('NEWFIRST', newfirst, newtails);
                        // return;

                        if (!newfirst) {
                            log('NO NEWFIRST:', salat, '-', samasa, 'afirst:', afirst, 'asecond', asecond, 'depth', depth);
                            log('first:', first, 'second:', second, 'add res:', addres);
                            throw new Error('!!!!=============== NO NEW FIRST');
                            return;
                        }

                        // if (first == 'विगत' && second == 'इच्छा') log('NEWFIRST', newfirst, 'tails:', newtails.length, pdch, 111, afirst, 222, asecond);

                        if (newtails.length == 0) {
                            var json = JSON.stringify(pdch);
                            var ready = JSON.parse(json);
                            pdchs.push(ready);
                            // if (first == 'विगतेच्छाभय' && second == 'क्रोधः') log('PUSH', pdch);
                        }

                        newtails.forEach(function(newtail, idz_) {
                            newtail.forEach(function(bsecond, idw_) {
                                // if (newfirst == 'विगतेच्छाभय' && bsecond == 'क्रोधः') log('NEXT LEVEL', idz_, idw_);
                                getPada(newfirst, bsecond, depth);
                            });
                        });
                        // pdch.push(1111);
                        pdch.pop();
                    } // end getPada

                    getPada(afirst, asecond, 0);
                }); // tail
            }); // tails

        });
    });
    // p(pdchs.slice(-26));
    var uhash = {}

    pdchs.forEach(function(pdch) {
        var key = pdch.join('');
        if (!uhash[key]) uhash[key] = pdch;
    });
    var uniq = _.values(uhash);
    // p(uniq);
    pdchs.forEach(function(pdch) {
        // log('===========>>>', pdch)
        // if (pdch[0] == 'त्विदमेत्' ) log('===========>>>', JSON.stringify(pdch));
        // if (pdch[0] == 'तु' ) log('===========>>>', JSON.stringify(pdch));
        // var size = pdch.length-1;
        // var ends = u.endsWith(pdch[size], 'म्')
        // if (!ends) log('===========>>>', JSON.stringify(pdch));

        // योगान् // योग // योगानुशास् // एतेषाम् // तु // त्विदमेत् // त्विदम् // 'पाण्डवाः' == 'पाण्डवाः'
    });
    log('flakes size:', salat, samasa, samasa.length, '-->', pdchs.length)
    // return [];
    return pdchs;
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