var csv = require('csv');
var fs  = require('fs');

console.log("Hello World");

//Input is cut and pasted section from table 2a of hpssadataset11medianhousepricefornationalandsubnationalgeographiesexistingdwellingsquarterlyrollingyear.xls file
//Years have to be added afterwards

fs.readFile('enghousinginput.csv', function read(err, data) {
    if (err) {
        throw err;
    }

    csv.parse(data, function(err, data){
        //console.log(data);
        var annualData = [];
        var castToNumber = function (str) {
            console.log(str);
            if (str) return Number(str.replace(/[^0-9a-z]/gi, ''));
            else return '-';
        };
        data.forEach(function(currentValue, rowIndex){
            var annualRow = [];
            annualRow.push(currentValue[0]);
            annualRow.push(currentValue[1]);
            for (var i = 2; i < currentValue.length; i+=4) {
                console.log(i);
                var total = castToNumber(currentValue[i]) + castToNumber(currentValue[i+1]) + castToNumber(currentValue[i+2]) + castToNumber(currentValue[i+3]);
                console.log(i+3);
                annualRow.push(Math.floor(total/4));
            }
            console.log(annualRow);
            annualData.push(annualRow);
        });
        //console.log(estimateArray);
        console.log(annualData);
        csv.stringify(annualData, function(err, csvText) {
            fs.writeFile('enghousingoutput.csv', csvText);
        });
    });
});
