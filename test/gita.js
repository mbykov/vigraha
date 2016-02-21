// по образцу sandhi/test/gita/dict2clean
// читает db gita, пропускает через sandhi.outer, sandhi.del,
//

var salita = require('salita-component');
var _ = require('underscore');
// var fs = require('fs');
// var util = require('util');
var s = require('sandhi');
var u = s.u;
var c = s.const;
var sandhi = s.sandhi;
var outer = s.outer;
var log = u.log;
var p = u.p;
var inc = u.include;
var Relax = require('relax-component');
var relax = new Relax('http://admin:kjre4317@localhost:5984');
relax.dbname('gita');
var rasper = require('../index');


// var lat = process.argv.slice(2)[0] || false;

runGitaTests();

var bugs = ['यावदेतान्निरीक्षेऽहं'];

function runGitaTests() {
    getDocs(function(docs) {
        // var cleans = cleaner(docs)
        docs = docs.slice(35);
        docs.forEach(function(doc, idx) {
            // p(doc);
            log('IDX', idx, 'sutra:', doc.num);
            doc.lines.forEach(function(line, idy) {
                if (line.form == '।') return;
                if (!line.dicts) return;
                // log(idy)
                // if (idy !=6) return;
                var samasa = line.form;
                if (inc(bugs, samasa)) return;
                if (samasa.length > 19) {
                    log('LONG:', samasa, 'size:', samasa.length);
                    return;
                }
                var next = doc.lines[idy+1];
                next = (next) ? next.form : '';
                // log('SAM', samasa, 'NEXT', next)
                var clean = outer(samasa, next);
                // log('CLEAN', clean);
                // log('_ID', doc._id)
                var dicts = line.dicts.map(function(dict) { return dict.form });
                var cleans = dicts.map(function(dict, idz) {
                    var next = dicts[idz+1];
                    next = (next) ? next.form : '';
                    return correct(dict, next); // simple outer, only M
                })
                var flakes = rasper.cut(clean);
                // log('flakes.size', flakes.length);
                // log(samasa, dicts, cleans);
                // return;
                var exists = false;
                var key;
                var test = cleans.join('-');
                // if (test == 'प्राणान्-त्यक्त्वा') log('Text', test);
                flakes.forEach(function(flake) {
                    // if (flake[0] == 'प्राणान्') log('F', flake);
                    key = flake.join('-');
                    if (key == test) {
                        // log('TRUE')
                        exists = true;
                        return;
                    }
                });
                if (!exists) {
                    // p(flakes);
                    var salat = salita.sa2slp(samasa);
                    log('gita.js: no existing key ! - samasa:', salat, '-', samasa, 'dicts:', dicts, 'cleans:', cleans);
                    throw new Error('NO EXISTING KEY');
                }
            });
        });
    });
}





// line.clean сам нуждается в исправлении, в частности, анусвара - на m
// a.k.a outer-light, только для составных внутренних line.clean, последняя требует outer
function correct(str, next) {
    var clean = str;
    var fin = u.last(str);
    if (!next) next = '';
    if (!next.form) next = ''; // откуда тут объект? д.б. строка только
    var beg = next[0];
    var n = 'म';
    // здесь изображение правила: doubled palatal - var dental = u.palatal2dental(mark.fin);
    if (beg == 'च') n = 'न';
    if (fin == c.anusvara) clean = [u.wolast(str), n, c.virama].join('');
    // три простые правила, как в outer ?
    // else if (fin == 'ो' && inc(c.soft, beg)) clean = [u.wolast(str), c.visarga].join('');
    // else if (fin == 'ो' && inc(c.soft, beg)) log('OOO', str, 'beg', beg, 222) // परयाो
    // else if (fin == 'ा' && (inc(c.allvowels, beg) || inc(c.soft, beg))) clean = [samasa, c.visarga].join('');
    return clean;
}


function getDocs(cb) {
    var view = 'gita/byDocs';
    relax
        .view(view)
    // .query(query)
        .query({include_docs: true})
        .query({limit: 10000})
        .end(function(err, res) {
            if (err) cb(err);
            var rows = JSON.parse(res.text.trim()).rows;
            var docs = _.map(rows, function(row) { return row.doc; });
            cb(docs);
        });
    // cb([]);
}
