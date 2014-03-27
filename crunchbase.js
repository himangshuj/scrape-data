var http = require('http');
var key = process.env.crunchbasekey;
var fs = require('fs');
var readline = require('readline');
var query = process.env.query;
var _ = require('underscore');
var permalinks = [];
var json2csv = require('json2csv');
var async = require('async');
var currentPage = 0;
var getpermalinks = function(page) {
            currentPage = page;

	try{
	http.get("http://api.crunchbase.com/v/1/search.js?query=" + query + "&api_key=" + key + "&page=" + page, function(res) {
        var data = "";
	currentPage = page;
	console.log("http://api.crunchbase.com/v/1/search.js?query=" + query + "&api_key=" + key + "&page=" + page);
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
	try{				
            var parsed_data = JSON.parse(data);
            var total_pages = parsed_data.total / 10;
            var page = parsed_data.page;
            permalinks.push(_.map(parsed_data.results, function(el) {
                return el.permalink;
            }));
            console.log(_.size(permalinks));
            if (page < total_pages) {
                getpermalinks(page + 1);
            } else {
                var permalinksFlat = _.flatten(permalinks); //WTF logic doing it serially I am not an idiot CB has rate limitations
                var parallelTasks = [];
                permalinksFlat.forEach(function(permalink) {
                    parallelTasks.push(function(callback) {
                        getSingleDetail(permalink, callback);
                    });
                });
                async.parallelLimit(parallelTasks,100, function(err, companyData) {
                    json2csv({
                        data: companyData,
                        fields: ['name', 'homepage_url', 'founded_year', 'deadpooled_year', 'overview', 'total_money_raised']
                    }, function(err, csv) {
                        if (err) console.log(err);
                        fs.writeFile('data/' + query + ".csv", csv, function(err) {
                            if (err) throw err;
                            console.log('file saved');
                        });
                    });
                });
            }
	} catch ( e){
		console.log("skipping " + currentPage);
		getpermalinks(currentPage + 1);
		}
        });
    });
	}catch(e){
		console.log("skipping"+currentPage);
		getpermalinks(currentPage + 1);

	}
};
var companyData = [];
var getSingleDetail = function(permalink, callback) {
    var data = "";
    console.log("http://api.crunchbase.com/v/1/company/" + permalink + ".js?api_key=" + key);
	try{
    	http.get("http://api.crunchbase.com/v/1/company/" + permalink + ".js?api_key=" + key, function(res) {
        console.log("fetching company data");
        //FIXME: add error handler. Requeue errored task
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
           var parsedData = {};
		try{
		       	parsedData = JSON.parse(data);
		}catch(err){
			console.log("ignoring"+permalink);
		}
            	callback(null, parsedData);
        	});
    	}).on('error',function(){
		callback(null,{});
	});
	}catch(err){
		callback(null,{});
	}
}

getpermalinks(1);
