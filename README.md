scrape-data
===========

collection of  scripts to collect information from internet

usage-instructions
==================

to query crunchbase and find info summary info about crunchbase

git clone https://github.com/himangshuj/scrape-data.git

cd scrape-data


mkdir data


export query=&lt;query term you would type on crunchbase&gt;


export crunchbasekey=&lt;your api key&gt;


npm install


node crunchbase.js

alexa scraping
======

This will create a file called alexa.csv in the data folder
node alexa.js &lt; {file containing list of urls , one url in a line}

