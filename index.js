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
        if (beg && !u.isConsonant(beg)) continue;
        // if (rawsamasa == samasa) continue;
        // log('pos', pos, 'R', rawsamasa, 'S', samasa, 'B', beg);
        var res = sandhi.del(rawsamasa, samasa);
        // log('R', res);
        if (res.length == 0) {
            log('======================>>>>>>>> ZERO RES', rawsamasa, 'samasa:', samasa, rawsamasa == samasa);
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
    while (cutpos < 10) {
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


rasper.prototype.cut = function(samasa) {
    var flakes = this.scrape(samasa);
    var flakefirsts = flakes.map(function(flake) { return flake.firsts});
    // flakefirsts = _.uniq(_.flatten(flakefirsts));
    log('Fs', flakefirsts);
    var pdchs = [];
    flakes.forEach(function(flake, idx) {
        var firsts = flake.firsts;
        firsts = _.uniq(firsts);
        log('=========================FIRSTS:', firsts);
        firsts.forEach(function(afirst, idy) {
            // log('IDX', idx, idy)
            var tails = flake.tails;
            tails.forEach(function(atail, idz) {
                atail.forEach(function(asecond, idw) {

                    if (afirst != 'त्विद') return;
                    log('flake:', idx, idy, 'afirst:', afirst, 'tails', idz, idw, 'asecond:', asecond);
                    // return;

                    var pdch = [ afirst];
                    function getPada(first, second, depth) {
                        if (!pdch) return;
                        depth++;
                        if (depth > 2) return;
                        pdch.push(second);
                        // HERE: ======================
                        // короче, нужно тупо применить sandhi.add
                        // и newfirst - обязан - всегда - найтись
                        // делаю sandhi.add и возвращаюсь сюда - с гитой!

                        var newfirst;
                        var newtails;
                        var addres = sandhi.add(first, second);
                        if (addres.length > 1) {
                            log('addres.length > 1', 'afirst:', afirst, 'asecond:', asecond, 'f:', first, 's:', second, 'added:', addres);
                            throw new Error('addres.length > 1');
                        }
                        var added = addres[0];
                        log('A:', 'f:', first, 's:',second, 'added:', added);
                        var newidx;
                        flakes.forEach(function(flake, idx_) {
                            // if (idx < idx_) return;
                            // if (found) return;
                            var firsts = flake.firsts;
                            firsts = _.uniq(firsts);
                            firsts.forEach(function(f, idy_) {
                                // if (u.startsWith(f, cfirst) && u.endsWith(f, csecond)) {
                                if (f == added) {
                                    newfirst = f;
                                    newtails = flake.tails;
                                    newidx = idx_;
                                    // log('NF', newfirst);
                                    // found = true;
                                    return;
                                }
                            });
                        });
                        log('NNNFFF', newfirst)
                        if (!newfirst) {
                            // log('afirst', afirst, 'asecond', asecond, 'first', first, 'second', second, 'cfirst', cfirst, 'csecond', csecond);
                            log('afirst', afirst, 'asecond', asecond, 'first', first, 'second', second, 'added', added);
                            throw new Error('!!!!=============== NO NEW FIRST');
                        }

                        // if (pdch.length - depth != 1) return;
                        // if (second == 'इदम्') log('==>', first, 'nf', newfirst, newtails)

                        if (newtails.length == 0) {
                            log('ENDS', newfirst)
                            pdchs.push(pdch);
                            pdch = [ first, second];
                            if (idw == atail.length-1) pdch = false;
                            // pdch = false;
                            return;
                        }
                        if (!newtails) log('NO TAILS', newflake);
                        newtails.forEach(function(newtail, idz_) {
                            newtail.forEach(function(bsecond, idw_) {
                                // pdch.push(asecond);
                                // if (idw > idw_) return;
                                // if (!pdch) pdch = [ first, second];
                                if (afirst == 'त्विद्') log('cycle==> A afirst:', afirst, 'asec:', asecond, 'NOW f;', first, 'sec:', second, 'CYCLE', 'bsec:', bsecond, 'nf:', newfirst, 'pdch:', pdch, 'id', idx, idy, idz, idw, 'idx_', newidx, idz_, idw_);
                                // if (first == 'त्विदमेत्') log('cycle==> f:', first, 'sec', second, 'nf:', newfirst, 'asec:', asecond, 'bsec', bsecond, 'pdch:', pdch, 'newtail', newtail);
                                getPada(newfirst, bsecond, depth);
                            });
                        });
                        // pdch.push(1111);
                    } // end getPada

                    // getPada(afirst, asecond, 0);
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
        if (pdch[0] == 'त्विदमेत्' ) log('===========>>>', JSON.stringify(pdch));
        // var size = pdch.length-1;
        // var ends = u.endsWith(pdch[size], 'म्')
        // if (!ends) log('===========>>>', JSON.stringify(pdch));

        // योगान् // योग // योगानुशास् // एतेषाम् // तु // त्विदमेत्
    });
    log('size', samasa.length, '-->', pdchs.length)
    return [];
    // return pdchs;
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
