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

function runGitaTests() {
    getDocs(function(docs) {
        // var cleans = cleaner(docs)
        docs = docs.slice(0,10);
        docs.forEach(function(doc, idx) {
            // p(doc);
            log('IDX', idx, 'sutra:', doc.num);
            doc.lines.forEach(function(line, idy) {
                if (line.form == '।') return;
                if (!line.dicts) return;
                // log(idy)
                // if (idy !=6) return;
                var samasa = line.form;
                var next = doc.lines[idy+1];
                var clean = outer(samasa, next);
                var dicts = line.dicts.map(function(dict) { return dict.form });
                var cleans = dicts.map(function(dict, idz) {
                    var next = dicts[idz+1];
                    return correct(dict, next); // simple outer, only M
                })
                var flakes = rasper.cut(clean);
                // log('flakes.size', flakes.length);
                // log(samasa, dicts, cleans);
                // return;
                var exists = false;
                var key;
                var test = cleans.join('-');
                // log('CLEANS', test);
                flakes.forEach(function(flake) {
                    // if (flake[0] == 'पाण्डवाः') log('F', flake);
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

// // добавляет в doc поле clean:
// // в случае saH, eshaH, ye - outer достаточно, можно как-то пометить, как окончательный результат. Или все равно, сл. этап - termins?
// function cleaner(docs) {
//     // docs = docs.slice(165);
//     docs.forEach(function(doc, idy) {
//         log('IDY', idy)
//         var sloka = doc.shloka.split('॥')[0]; // doc.SH-loka !
//         var samasas = sloka.split(' ');
//         samasas.forEach(function(samasa, idx) {
//             // log('c', idx, samasa)
//             var next = samasas[idx+1];
//             if (!next || samasa == '।') return; // FIXME: это бы надо проверить - вдруг есть случай, где есть line.clean и нет next ?
//             // log('->', idx, samasa)
//             var line = doc.lines[idx];
//             if (!line) throw new Error('no line for samasa');
//             // log('==', idx, samasa, line)
//             if (line.form !=samasa) {
//                 log(doc.num, idx, samasa, line.form, doc._id);
//                 throw new Error('fine.form !=samasa');
//             }

//             var clean = outer(samasa, next);
//             // FIXME: убрал из-за 11.17 - замена fin-d на глухую fin-t в среднем компоненте. А в outer, выходит, этого у меня нет
//             checkOuter(idy, idx, doc, line, samasa, next, clean);
//             if (!line.dicts) return;
//             if (!line.clean && line.dicts.length ==0) {
//                 log(doc.num, idx, samasa, line.form, doc._id);
//                 throw new Error('empty dicts');
//             }
//             // checkDicts2(idy, idx, doc, line, samasa, next, clean);
//             // if (idy != 0) return;
//             checkDicts(idx, doc, line, samasa, next, clean);
//         });
//     });
//     return docs;
// }

// function checkDicts(idx, doc, line, samasa, next, clean) {
//     // log('DDDD', idx, line);
//     var num = doc.num;
//     var size = line.dicts.length;
//     var first = line.dicts[0].form; // result
//     first = correct(first);
//     var reverse = line.dicts.reverse();
//     var results = [clean];
//     // log('C=>');
//     // log('clean===>', clean);
//     reverse.forEach(function(dict, idz) {
//         var current = dict.form;
//         var dictform = reverse[idz-1];
//         var dictformclean = (dictform) ? dictform.form : '';
//         var dictnext = (reverse[idz+1]) ? reverse[idz+1].form : 'none';
//         // log('D', dictformclean)
//         if (idz == 0) current = outer(current, next); // на outer проверяю только первую паду
//         else current = correct(current, dictformclean); // но в остальных  нужно все же поправить анусвару
//         // log(num, idz, 'results:', results, '- current:', current );
//         // if (u.isVowel(beg)) {
//         //     // if (cut) second = second.slice(1);
//         //     second = second.slice(1);
//         //     // else second = [u.liga(beg), u.wofirst(second)].join(''); // test starts with vowel, but it was not cutted - (doubled nasals, ayadi);
//         // }
//         current = u.wofirstIfVow(current);
//         if (idz == size - 1) {
//             if (inc(results, first)) return; // это final ok <<<=====
//             log('== error: not final ok ==', doc.num, idx, 'idz:', idz, 'size:', line.dicts.length, samasa, 'stems:', results, 'last-form', dict.form);
//             throw new Error('not ok');
//         }
//         results = removePada(doc.num, results, current, dictnext);
//     });
// }

// // вычитаю очередную паду из каждого стема, суммирую
// function removePada(num, results, current, dictnext) {
//     var trnres = results.map(function(r) { return salita.sa2slp(r)}); // FIXME:
//     var trncur = salita.sa2slp(current);

//     log('=> remove pada - current', num, results, trnres, current, trncur, 'next', dictnext);

//     var stems = [];
//     var anySeconds = [];
//     results.forEach(function(clean, idz) {
//         var res = sandhi.del(clean, current);
//         if (!res) return;
//         var firsts = res.map(function(r) { return r.firsts});
//         firsts = _.flatten(firsts);
//         stems = stems.concat(firsts);
//     });
//     // log('stems ===========>>', stems); // когда возвращается [''] ? // आपृथिव्योः
//     if (stems.length == 0 || stems == []) {
//         log('== no stems [] ==', num, 'results:', JSON.stringify(results), 'current:', current, 'stems', stems);
//         throw new Error('no stems');
//     }
//     return stems;
// }


// // dicts.length = 2, только для внесения исправлений
// function checkDicts2(idy, idx, doc, line, samasa, next, clean) {
//     // log(idy, idx, line, 2, samasa, 3, next, 4, clean)
//     if (line.dicts.length != 2) return;
//     // log('idy', idy);
//     var first = line.dicts[0].form;
//     first = correct(first);
//     var second = line.dicts.slice(-1)[0].form;
//     if (!second) throw new Error('no second in dicts');
//     second = outer(second, next);
//     // log('-----', idy, idx, samasa, 2, second)
//     var results = sandhi.del(clean, second);
//     if (!results) log('==>', idy, doc.num, doc._id);
//     if (!results) log('=no del=', idx, 'samasa-clean:', clean, 'second', second);
//     if (!results) throw new Error('no del result');
//     var firsts = results.map(function(result) { return result.firsts});
//     firsts = _.flatten(firsts);
//     // если dicts > 2, то цикл по всем first, а там свои firsts, сложно
//     // но - если в одном из first обнаруживается предыдущий компонент, то остальные first можно отбросить?
//     // для BG - точно, а для произвольного текста?
//     // log('firsts', firsts);
//     var absent = !inc(firsts, first);
//     if (absent) log('==>', idy, doc.num, doc._id);
//     if (absent) log(idx, 'clean', clean, '-', second,  ' = first', first,  'should be in firsts:', firsts, 'next', next[0]);
//     if (absent) throw new Error('doc.clean != clean');
// }

// // проверка целого слова на outer-sandhi
// function checkOuter(idy, idx, doc, line, samasa, next, clean) {
//     if (!line.clean) return;
//     var result = correct(line.clean, next);
//     if (clean != result) log('==>', idy, doc.num, doc._id);
//     if (clean != result) log('line.clean', line.clean);
//     if (clean != result) log('CLEAN: samasa', idx, samasa, 'clean', clean, 'result', result, 'next', next);
//     if (clean != result) throw new Error('doc.clean != clean');
//     return result;
// }

// line.clean сам нуждается в исправлении, в частности, анусвара - на m
// a.k.a outer-light, только для составных внутренних line.clean, последняя требует outer
function correct(str, next) {
    var clean = str;
    var fin = u.last(str);
    if (!next) next = '';
    var beg = next[0];
    var n = 'म';
    // здесь изображение правила: doubled palatal - var dental = u.palatal2dental(mark.fin);
    if (beg == 'च') n = 'न';
    if (fin == c.anusvara) clean = [u.wolast(str), n, c.virama].join('');
    // три простые правила, как в outer ?
    // else if (fin == 'ो' && inc(c.soft, beg)) clean = [u.wolast(samasa), c.visarga].join('');
    // else if (fin == 'ा' && (inc(c.allvowels, beg) || inc(c.soft, beg))) clean = [samasa, c.visarga].join('');
    // if (inc(c.soft, beg)) log('============>>>>>>', fin, 2, beg, 3, fin == 'ो' ) // मय्यर्पितमनो
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
