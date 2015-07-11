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
var couch = require('./lib/couch');
var debug = (process.env.debug == 'true') ? true : false;

dbpath = 'http://localhost:5984';
var Relax = require('relax-component');
var relax = new Relax(dbpath);
relax.dbname('sa');


module.exports = vigraha();

function vigraha() {
    if (!(this instanceof vigraha)) return new vigraha();
    return this;
}



/*
  scrape aka rasp - строгать, скоблить - создает чешуйки
  берем samasa, создаем чешуйки-flakes от каждого символа до - двух-трех слогов, (пока без учета приставок и флексий)
  забирает flakes - чешуйки из базы
  - итак, вынести в lib/couch? - потом, это почти не даст выигрыша места
 */
vigraha.prototype.get = function(samasa, cb) {
    var pdch;
    // TODO: видимо, вынести в предварительную обработку потом
    var avagrahas = samasa.split(c.avagraha);
    if (avagrahas.length > 1) {
        var second = ['अ', avagrahas[1]].join('');
        var result = sandhi.del(samasa, second)[0];
        // var newres = {pos: current.pos, reg: reg, num: current.num, pada: first};
        var first = {pos: 0, num: 'start', pada: result.firsts[0]};
        var second = {pos: result.pos, num: result.num, pada: result.seconds[0]};
        var pdch = [first, second];
        // log('PDCH', pdch);
        cb([pdch]);
        return;
    }

    if (debug) log('=========== SPLITTER', samasa, salita.sa2slp(samasa));
    var numbers = samasa.split('').map(function(s, i) { return [i, s].join('-')});
    if (debug) log(JSON.stringify(numbers));
    var tails = cutTails(samasa);
    // log('TAILS', tails);
    // cb([]);
    // return;
    var flakes = shredder(tails);
    // ulog(flakes);
    // cb([]);
    // return;
    var stems = [];
    // flakes.forEach(function(flake) { stems = stems.concat(flake.padas)}); // OLD FLAKES
    flakes.forEach(function(flake) {
        var padas = flake.padas.map(function(pada) { return pada.first});
        stems = stems.concat(padas);
    });
    stems = _.uniq(stems);
    if (debug) log('uniq flake-stems', stems.length);
    // stems = _.select(stems, function(u) { return vowCount(u) > 1 });
    stems = _.select(stems, function(str) { return str.length > 1 });
    // FIXME: здесь, наверное, д.б. исключения - 'च', etc - какие еще?
    // stems.push('च');
    // log('============>>>>>>>> STEMS:', JSON.stringify(stems));
    // cb([]);
    // return;

    var qkeys = 'keys=' + JSON.stringify(stems);
    var view = 'sa/stem';

    relax
        .view(view)
        .query(qkeys)
        // .query({include_docs: true})
        .query({limit: 100})
        .end(function(err, res) {
            if (debug) log('-------------------------------------------------------------couch');
            if (err) return cb(err);
            var rows = JSON.parse(res.text.trim()).rows;
            var stems = rows.map(function(row) { return row.key });
            if (debug) log('result-stems:', stems.length, '-uniq:', _.uniq(stems).length);
            var uniqs = _.uniq(stems);
            uniqs = _.without(uniqs, samasa); // FIXME: тут нужно сохранять результат samasa, если он есть, чтобы показать и не искать снова
            if (debug) log('============>>>>>>>> uniq:', JSON.stringify(uniqs));
            // cb([]);
            // return;

            var padas = onlyExisting(flakes, uniqs);
            // log('PADAS', padas);
            if (padas.length == 0) {
                cb([]);
                return;
            }

            // FIXME: ONLY FOR TESTS HERE!!
            // var cleans = cutFlakes([], {}, padas);
            // ulog(cleans);
            // var longs = longests(cleans);
            // log('LONGS:', longs.length);
            // ulog(longs);
            // cb([]);
            // return;

            var pdch = padaccheda(padas);
            // ulog(pdch);
            var jsons = pdch.map(function(p) { return JSON.stringify(p)});
            jsons = _.uniq(jsons);
            pdch = jsons.map(function(p) { return JSON.parse(p)});
            if (debug) ulog(pdch);
            cb(pdch);
        });

}

function longests(cleans) {
    var maxvows = cleans.map(function(flake) {
        return maxPadas(flake);
    });
    var vc = _.max(maxvows);
    var longs = _.select(cleans, function(flake) {
        return flake.max == vc;
    });
    return longs;
}

// flake только с наидлиннейшими padas by syllables
function maxPadas(flake) {
    var max = _.max(flake.padas, function(pada) { return pada.vows});
    var vc = max.vows;
    var mpadas = _.select(flake.padas, function(pada) { return pada.vows == vc});
    flake.padas = mpadas;
    flake.max = vc;
    return vc;
}

// обрезание - clipping
/*
   - region + delta на концах - объект ready
   обрезать все flakes по ready, отсортировать, убрать внутренние
   найти длиннейшие padas во всех flakes: flake-currents
   рекурсия
*/
// recursion
function padaccheda(flakes) {
    // ulog(flakes);
    var fn = function(result, res, region, ready, flakes) {
        if (debug) log('');
        if (debug) log('------------------------>>>--------------------- === CIRCLE-START ===', region, 'FLAKES-length', flakes.length);
        // region = [0,1,2];

        // FIXME: TODO: == ЗДЕСЬ Я cleans ОБРЕЗАЮ ПО РЕГИОНУ. А НАДО УЧИТЫВАТЬ ==== DELTA ===== на краях РЕГИОНА
        // =====================================================================
        // log('------------------------>>>--------------------- === CIRCLE-READY ===', ready);
        region = ready.region;
        // создаю набор flakes, удовлетворяющий данному наличному ready
        var cleans = cutFlakes(region, ready, flakes);
        // выбираю несколько правдоподобных-наилучших - сейчас длиннейших по кол. слогов
        var currents = longests(cleans);
        if (debug) {
            log('CUT FLAKES-cleans: -------------------------------------- ');
            ulog(cleans);
            log('CURRENTS: -------------------------------------- ');
            ulog(currents);
        }

        if (debug) log('================= STARTS-MAP========================>>', currents.length);
        // FIXME: TODO: только если длинные не пересекаются, то можно взять любой из них
        currents.forEach(function(current) {
            if (debug) {
                log('---------------------------------- start log');
                log('START-CURRENT:', current);
                log('FLAKES:');
                // ulog(flakes);
                log('REGION:', region);
                // if (region.length == 0) res = []; // FIXME: проверить
                log('RES:');
                ulog(res);
                log('---------------------------------- end log');
            }

            // FIXME: или считать region здесь по res, или передавать его сюда // so, имеен смысл именно REGION-2
            if (res.length > 0) {
                region = _.reduce(res, function(memo, pada){ return memo.concat(pada.reg); }, []);
                region = _.sortBy(region, function(n) { return n});
            }
            if (debug) log('REGION=2:', region);

            current.padas.forEach(function(pada) {
                // log('CUR', pada);
                var first = pada.first;
                var reg = _.range(current.pos, current.pos+first.length);
                if (debug) log('CURRENT-REGION', first, reg);
                var newregion = region.concat(reg);
                newregion = _.sortBy(newregion, function(n) { return n});
                if (debug) log('NEW-REGION  ------ ', newregion);


                // вот такая идея - не region, но ready-объект, 2 сутры
                // но: слияние - проблема - нужно найти сутры по краям, причем - первая - первая из двух первых, последняя - последняя из двух последних
                // при условии, что region не имеет разрыва, в который может попасть новый flake-pada
                // а массив readies-ов?
                var delta = merge(current.delta, pada.delta);
                var ready = {pos: current.pos, region: newregion, flake: pada.first, delta: delta};
                if (debug) log('READY-OBJECT:'), ulog(ready);
                // log('READY-OBJECT:'), ulog(ready);
                // как тут теперь newdelta считать?

                var newpadas = _.select(flakes, function(flake) { // rest of flakes that fits region
                    return (cutLongestFlake(newregion, ready, flake).padas.length == 0) ? false : true;
                });
                if (debug) {
                    log('NEW PADAS:');
                    ulog(newpadas);
                }

                var cres =_.clone(res);
                var newres = {pos: current.pos, reg: reg, num: current.num, pada: first};
                if (debug) {
                    log('==ADD NEW RES TO CHAIN <===', newres);
                }
                cres.push(newres);
                if (newpadas.length < 1) {
                    cres = _.sortBy(cres, function(pada) { return pada.pos}); // комм чтобы узнать порядок padas
                    if (debug) log('FIN: ==================>>>>> last res in chain >>>');
                    // log(cres);
                    if (debug) log('FIN:==================>>>>>', cres.length, 'res in chain');
                    // var pick = _.map(cres, function(pada) { return _.pick(pada, 'pos', 'pada')});
                    result.push(cres);
                    return;
                } else {
                    if (debug) log('---- continue chain----');
                    fn(result, cres, newregion, ready, newpadas);
                }
            });

        });
        if (debug) log('>>>>>>>>>>>>>>>> WHEN???', result.length);
        return result;
    }
    var ready = {delta:{}, region:[]};
    return fn([], [], [], ready, flakes);
}

function merge(obj1,obj2){
    var obj3 = {};
    for (var pos in obj1) { obj3[pos] = obj1[pos]; }
    for (var pos in obj2) { obj3[pos] = obj2[pos]; }
    return obj3;
}

/*
  g=.40.+_11_ - нужно НЕ пропустить 6.1.101
*/

function cutFlakes(region, ready, flakes) {
    var cleans = [];
    flakes.forEach(function(flake) {
        var clean = cutLongestFlake(region, ready, flake);
        if (clean.padas.length == 0) return;
        cleans.push(clean);
    });
    return cleans;
}

// flake with only padas that fit region
function cutLongestFlake(region, ready, flake) {
    // log(' flake: ------------------------------------', flake);
    // log('POS', flake.pos, region);
    // if (debug) log('====== P-region ======', flake.pos, region); // перекрытие на 1 на втором круге - sandhi
    // ulog(ready);
    var onlyfits = _.select(flake.padas, function(pada) {
        var first = pada.first;
        var pregion = _.range(flake.pos, flake.pos+first.length);
        var cross = _.intersection(region, pregion);

        if (cross.length > 1) return false;
        else if (cross.length == 1) {
            var pos = cross[0];
            // if (debug) log('====== PPPPPP ======', pos, pregion, first, pada.fin); // перекрытие на 1 на втором круге - sandhi
            // log('NNNNNNNNNNNNNNNNNNNNNNNNNNNNNN =========================');
            // log('ready: =========================', ready);
            // log('pada: =========================', pada.first, pada.delta);
            if (ready.delta[cross] && pada.delta[cross]) {
                // log('YES!', ready.delta[cross], pada.delta[cross]);
                return true;
            }
            // return true;
            return false;
        } else {
            return true;
        }
    });
    var clean = {pos: flake.pos, num: flake.num, padas: onlyfits, delta: flake.delta};
    // here delta - здесь плохо? дельта должна быть?
    return clean;
}

function onlyExisting(flakes, uniqs) {
    var cleans = [];
    flakes.forEach(function(flake) {
        var padas = [];
        flake.padas.forEach(function(pada) {
            if (u.c(uniqs, pada.first)) padas.push(pada);
        });
        padas = padas.sort(function (a, b) { return b.length - a.length; });
        if (padas.length == 0) return;
        flake.padas = padas;
        cleans.push(flake);
    });
    // if (debug) log('CLEANS: -------------------------------------- ');
    // if (debug) ulog(cleans);
    return cleans;
}

/*
  == cut tails ==
 */
function cutTails(samasa) {
    var tails = [];
    if (debug) log('=SAMASA=', salita.sa2slp(samasa));

    for (var i=0; i<samasa.length; i++){
        var head = samasa.substr(0, i);
        var tail = samasa.substr(i);
        if (tail[0] == c.virama) continue;
        tail = firstLiga2vow(tail);

        // log('TAIL', i, samasa, salita.sa2slp(samasa), tail, salita.sa2slp(tail));
        var res = sandhi.del(samasa, tail);
        // log('==== RES ==== ===', res);
        res.forEach(function(r) {
            if (!r.seconds) return log('NO_SECONDS!');
            var t = {pos: r.pos, num: r.num, tails: r.seconds}; // здесь именно r.pos, а не idx - вторая пада сдвигается к началу, когда убираем pattern
            t.delta = r.delta; // это временная передача дельты дальше во flake
            tails.push(t);
        });
    }
    // log('TTT', tails);
    return tails;
}

function firstLiga2vow(str) {
    var start = str[0];
    if (u.c(c.allligas, start)) {
        start = u.vowel(start);
        str = str.slice(1);
        str = [start, str].join('');
    }
    return str;
}

/*
  main method - cuts each tail into flakes with sandhi
*/
function shredder(tails) {
    var flakes = [];
    tails.forEach(function(tobj) {
        tobj.tails.forEach(function(tail) {
            var flake = {pos: tobj.pos, num: tobj.num};
            if (tobj.delta) flake.delta = tobj.delta;
            flake.padas = scrape(tail);
            flakes.push(flake);
        });
    });
    return flakes;
}

// ======= sandhi scraping ========
// TODO: здесь padas = pada.padas, переименовать
function scrape(tail) {
    var padas = [];
    var padas_ = [];
    var syms = tail.split('');
    var vows = (u.c(c.allvowels, syms[0])) ? 1 : 0;

    // log('==Tail=================', tail);
    syms.forEach(function(s, idx) {
        var next = syms[idx+1];
        var prev = syms[idx-1];
        var last = syms[syms.length-1];
        if (u.c(c.hal, s)) vows+=1;
        else if (c.virama == s) vows-=1;
        if (vows == 0) return;
        if (vows > 5) return;
        // next is not at the end AND next is virama:
        // log('idx', idx, 'sym', s, 'next', next, syms.length-1);
        // if ((idx != syms.length-1) && next == c.virama) return; // ananda - to not produce anana // प्रत्यङ; ऋद्धीष्ट
        // if (prev == c.virama) log('prev', idx, syms.length);
        // if (prev == c.virama) return; // ananda - to not produce anana // प्रत्यङ; ऋद्धीष्ट
        if (s == c.virama) return; // ऋद्धीष्ट, ananda - to not produce anana // प्रत्यङ

        var first = syms.slice(0, idx).join('');
        var second = syms.slice(idx).join('');
        second = firstLiga2vow(second);
        // log('--idx', idx);
        // log('first-second', first, '-', second);
        var flakes = sandhi.del(tail, second);
        flakes.forEach(function(flake, idy) {
            // if (tail == 'सैव') log('idx-idy', idx, idy, s, 'n', next, flake);
            flake.firsts.forEach(function(first) {
                // log('first-idx-idy', idx, idy, first, 'next', next, 'p', prev, first, '-', tail);
                var vows = vowCount(first);
                if (vows < 1) return;
                if (!next && prev == c.virama) return;  // tail=ananda - to not produce anana // प्रत्यङ; ऋद्धीष्ट // .101.+_4_
                var fpada = {fin: flake.num, first: first, vows: vows};
                // ======= ЗДЕСЬ flake.num == всегда в конце flake
                if (flake.delta) fpada.delta = flake.delta; // delta только в padas
                padas.push(first);
                padas_.push(fpada);
            });
        });
    });
    // padas.push(tail); // deva - arhita - devArhita, test: 101.16; may be restrict with only 5 vows? // именно правильно push всего хвоста, ибо дальше целого нет
    // имитация обработки флексии - отбрасываю последнюю гласную - g=.101.+_8_  nadISvarI - nadISvara
    // if (u.c(c.allligas, tail.slice(-1))) padas.push(tail.slice(0,-1));
    // padas = _.uniq(padas).reverse();
    // log('PADAS', padas);
    var vows = vowCount(tail);
    var endpada = {fin: 'end', first: tail, vows: vows, delta: {}};
    padas_.push(endpada);

    // log('PADAS_', padas_);
    if (tail == 'गुरोऽङ्ग्धि') log('PADAS_', padas_);
    return padas_;
}

function vowCount(str) {
    var syms = str.split('');
    var vows = (u.c(c.allvowels, syms[0])) ? 1 : 0;
    syms.forEach(function(s) {
        if (u.c(c.hal, s)) vows+=1;
        else if (c.virama == s) vows-=1;
    });
    return vows;
}

function trnArr(arr) {
    return arr.map(function(str) {
        return salita.sa2slp(str);
    });
}

function ulog (obj) {
    console.log(util.inspect(obj, showHidden=false, depth=null, colorize=true));
}
