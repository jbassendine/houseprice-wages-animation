var csv = require('csv');
var fs  = require('fs');

console.log("Hello World");

//Input is from nomis data download https://www.nomisweb.co.uk/query/construct/summary.asp?mode=construct&version=0&dataset=99 for ASHE LAD data, with notes cut off

fs.readFile('nomisnetladoutput.csv', function read(err, data) {
    if (err) {
        throw err;
    }

    csv.parse(data, function(err, data){
        //console.log(data);
        var estimateArray = [];
        var recording = false;
        var starti = 0, endi = 0;
        data.forEach(function(currentValue, rowIndex){
            currentValue.forEach(function(currentValue, columnIndex) {
                if (currentValue == "#" && !recording) {
                    //start recording
                    recording = true;
                    starti = columnIndex;
                } else if (currentValue !== '#' && recording) {
                    //end recording
                    recording = false;
                    endi = columnIndex;
                    estimateArray.push({
                        "row": rowIndex,
                        "starti": starti,
                        "endi": endi
                    });
                }
            });
        });
        //console.log(estimateArray);
        estimateArray.forEach(function(entry) {
            var row = data[entry.row];
            var starti = entry.starti;
            var endi = entry.endi;
            var length = endi - starti;
            var test1 = length < 4;
            var test2 = row[starti - 1].match(/^[0-9]{1,45}$/);
            var test3 = row[endi].match(/^[0-9]{1,45}$/);
            if (test1 && test2 && test3) {
                var compute = function (i) {
                    var base = row[starti - 1];
                    var increment = (row[endi] - base) / (length + 1);
                    var increase = (increment * (i + 1));
                    return Number(base) + Number(increase);
                };
                for (var i = 0; i < length; i++) {
                    var output = compute(i);
                    row[starti + i] = String(Math.floor(compute(i)));
                }
            }
        });
        csv.stringify(data, function(err, csvText) {
            fs.writeFile('nomisnetladoutputfilledin.csv', csvText);
        });
    });
});
