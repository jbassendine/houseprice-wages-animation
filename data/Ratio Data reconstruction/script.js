var csv = require('csv');
var fs  = require('fs');
var castToNumber = function (str) {
    if (str == "31461") {
      console.log(str);
    }
    console.log(str);
    return Number(str.replace(/[^0-9a-z]/gi, ''));
};
var isPositiveNumber = function(number) {
  if (!isNaN(number) && number !== 0) return true;
  else return false;
};
var calculateMortgagePayoff = function(housePrice, grossSalary) {
  //TODO justify these figures
  var interestRate = 0.05,
      wageInflation = 0.02,
      affordablePercentage = 0.30,
      monthCounter = 0,
      monthlyPayment,
      interestPayment,
      year,
      yearlySalary,
      capitalPayoff;


  var yearPayoff = function(startOfMonthPrincipalRemaining) {
    year = (monthCounter / 12);
    yearlySalary = grossSalary * Math.pow(1 + wageInflation, year);
    monthlyPayment = ((yearlySalary / 12) * affordablePercentage);
    interestPayment = (startOfMonthPrincipalRemaining * interestRate) / 12;
    capitalPayoff = (monthlyPayment - interestPayment);
    startOfMonthPrincipalRemaining = startOfMonthPrincipalRemaining - capitalPayoff;
    monthCounter++;

    if (monthCounter > 10000) return "Impossible";
    if (startOfMonthPrincipalRemaining > 0) {
      yearPayoff(startOfMonthPrincipalRemaining);
    }
    };
  yearPayoff(housePrice);
  return Math.floor(monthCounter / 12);
};

console.log("Hello World");

//Input is cut and pasted section from table 2a of hpssadataset11medianhousepricefornationalandsubnationalgeographiesexistingdwellingsquarterlyrollingyear.xls file
//Years have to be added afterwards

fs.readFile('housingprocessed.csv', function read(err, housingdata) {
    if (err) {
        throw err;
    }
    fs.readFile('nomisnetladprocessed.csv', function read(err, incomedata) {
        if (err) {
            throw err;
        }

        csv.parse(housingdata, function(err, housingArray){

            csv.parse(incomedata, function(err, incomeArray){
                var ratioArray = [];
                housingArray.forEach(function(currentValue, rowIndex) {
                    var incomeRow = incomeArray[rowIndex];
                    var housingRow = currentValue;
                    var ratioRow = [];
                    var ratioObject = {
                      yearlyData: []
                    };

                    housingRow.forEach(function(currentValue, columnIndex) {
                        if (rowIndex === 0) {
                            ratioRow[columnIndex] = housingRow[columnIndex];
                        } else if (columnIndex === 0){
                            ratioRow[columnIndex] = housingRow[columnIndex];
                            ratioObject.LADid = housingRow[columnIndex];
                        } else if (columnIndex === 1){
                            ratioRow[columnIndex] = housingRow[columnIndex];
                            ratioObject.LADname = housingRow[columnIndex];
                        } else {
                            if (housingRow[0] == "S12000005") {
                              console.log('hit');
                            }
                            var year = columnIndex + 1997;
                            var housingCost = castToNumber(housingRow[columnIndex]);
                            var income = castToNumber(incomeRow[columnIndex]);
                            var mortgagePeriod = 'Null';
                            var ratio = 'Null';
                            if (isPositiveNumber(income) && isPositiveNumber(housingCost)) {
                              mortgagePeriod = calculateMortgagePayoff(housingCost, income);
                              ratio = Number((housingCost / income).toFixed(2));
                            }
                            if (!isPositiveNumber(income)) income = 'Null';
                            if (!isPositiveNumber(housingCost)) housingCost = 'Null';
                            ratioRow[columnIndex] = ratio;
                            ratioObject.yearlyData.push({
                                "year": year,
                                "housingCost": housingCost,
                                "income": income,
                                "mortgagePeriod": mortgagePeriod,
                                "ratio": ratio
                            });
                        }
                    });
                    var rowJSON = JSON.stringify(ratioObject);
                    if (rowJSON) fs.writeFile("LADs/" + ratioObject.LADid + ".json", rowJSON);
                    ratioArray.push(ratioRow);
                });
                console.log(ratioArray);
                csv.stringify(ratioArray, function(err, csvText) {
                    fs.writeFile('ratiooutput.csv', csvText);
                });
            });

        });
    });
});
