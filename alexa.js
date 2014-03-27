var readline = require('readline');
var _ = require('underscore');
var urls = [];
var key = process.env.competekey;
var async = require('async');
var http= require('http');
var parseString = require('xml2js').parseString;
var json2csv = require('json2csv');
var rl = readline.createInterface({
	input: process.stdin,
      	output: process.stdout
	});
var fs = require('fs');
rl.on('line', function (url) {
	urls.push(function(callback){
		console.log("Processing"+url);
		try{
			http.get("http://data.alexa.com/data?cli=10&url="+url,function(res){
				var data = "";
				res.on("data",function(chunk){
					data+=chunk;
				});
				res.on("end",function(){
					parseString(data, function (err, result) {
						    callback(null,{url:url, rank: ((result.ALEXA.SD || [{}]) [0].REACH || [{'$':{'RANK':-1}}])[0]['$']['RANK']});
					});
				});
			}).on('error',function(){
				console.log("error parsing " + url);
				callback(null,{});
			});
			
		}catch(e){
			console.log(e);
			console.log("error parsing " + url);
			callback(null,{});
		}
	
	});
});
	
process.stdin.on('end', function() {
	console.log("ended ");
	async.parallelLimit(urls,20,function(err,data){
		json2csv({
			data: data,
			fields: ['url','rank']
		}, function(err, csv) {
			if (err) console.log(err);
			fs.writeFile("data/alexa.csv", csv, function(err) {
				if (err) throw err;
				console.log('file saved');
			});
		});

	});
});

