// по образцу sandhi/test/gita/dict2clean
// читает db gita, пропускает через sandhi.outer, sandhi.del,
// раскладывает sandhi (имеющие dicts) на padas, считает варианты цепочек,
// реальная расшифровка должна быть обнаружена среди всех вариантов
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
// var rasper = require('../weak_add'); // слабый вариант, требующий add в рекурсии


// var lat = process.argv.slice(2)[0] || false;

runGitaTests();


function runGitaTests() {
    getDocs(function(docs) {
        // var cleans = cleaner(docs)
        // docs = docs.slice(460);
        docs.forEach(function(doc, idx) {
            // p(doc);
            log('IDX', idx, 'sutra:', doc.num, '_ID', doc._id);
            doc.lines.forEach(function(line, idy) {
                if (line.form == '।') return;
                if (!line.dicts) return;
                // if (doc.num != '1.20') return;
                var samasa = line.form;
                // if (samasa != 'व्यवस्थितान्दृष्ट्वा') return;
                // log('LINE', line)

                if (samasa.indexOf('ऽ') > -1) return; // потому что аваграха обрабатывается иначе - деление всегда сразу по ней

                if (samasa.length > 22) {
                    log('LONG:', samasa, 'size:', samasa.length);
                    return;
                }

                var next = doc.lines[idy+1];
                next = (next) ? next.form : '';
                // log('SAM', samasa, 'NEXT', next)
                // var fin = u.last(samasa);
                // log('FIN', fin)
                var clean = outer(samasa, next);
                // log('CLEAN samasa:', samasa, 'clean:', clean, 'next:', next);
                // долгая А заменяется на visarga только если такая замена есть в резутьтате - last of dicts
                // по сути, я подглядываю ответ
                // может быть, можно просмотреть все такие случаи и увидеть закономеность? Например, слова на -r?
                var last = clean[clean.length-1];
                if (last == c.H) {
                    // log('HHHXS', line)
                    var lastdict = line.dicts[line.dicts.length-1];
                    var lastform = lastdict.form;
                    var fin = lastform[lastform.length-1];
                    if (fin == c.A) clean = samasa;
                    if (fin == 'ो') clean = samasa;
                    if (fin == 'े') clean = [samasa, c.e].join(''); // это верно, только если samasa на -a
                    if (u.isConsonant(fin)) clean = samasa;
                }
                // конечно, нужно будет отменить "второе простое правило" про -А в outer-sandhi
                // log('CLEAN FIXED - samasa:', samasa, 'clean:', clean);

                var dicts = line.dicts.map(function(dict) { return dict.form });
                var cleans = dicts.map(function(dict, idz) {
                    var next = dicts[idz+1];
                    next = (next) ? next.form : '';
                    return correct(dict, next); // simple outer, only M
                });
                var flakes = rasper.pdchs(clean);
                // log('flakes.size', flakes.length);
                // log(samasa, dicts, cleans);

                var exists = false;
                var key;
                var test = cleans.join('-');
                // 'स्मृतिः-मेधा'
                // if (test == 'सत्त्वम्') log('key', test);
                flakes.forEach(function(flake) {
                    // if (flake[0] == 'सत्त्वम्') log('F', flake);
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
                    // var clelat = salita.sa2slp(clean);
                    log('NO existing key - samasa:', salat, '-', samasa, 'dicts:', dicts, 'cleans:', cleans);
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
