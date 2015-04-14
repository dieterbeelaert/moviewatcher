/**
 * Created by dietn on 18/02/15.
 */

var Controller = require('./Controller.js');
var Settings = require('../settings.json');
var jsdom = require('jsdom');


function MovieController(req,res,ctx){
    this.prototype = new Controller(req,res,ctx);
    console.log("init moviecontroller");
}
module.exports = MovieController;


MovieController.prototype.doRequest = function(){
    var self = this;
    self.prototype.setResJSON(); //this controller always returns JSON
    switch(self.prototype.ctx.routeObj.action.toUpperCase()){
        case 'SEARCH': self.doSearch();
            break;
        case 'LINKS': self.doLinks();
            break;
        default: self.prototype.ctx.res.end();
            break;
    }
}

//TODO handle pagination .pagination is on page
MovieController.prototype.doSearch = function(){
    var self = this;
    var query = self.prototype.ctx.routeObj.id;
    var toReturn = [];
    if(query != '' || query != undefined) {
        var url = 'http://www.primewire.ag/index.php?search_keywords=' + query;
        jsdom.env(
            url,
            ["http://code.jquery.com/jquery.js"],
            function (errors, window) {
                if (!errors) {
                    $ = window.$;
                    toReturn = self.extractSearchResultsFromHtml($);
                    if($('.pagination').length > 0){
                        console.log("pagination...");
                        //get links from other pages
                        var otherPages = $('.pagination a');
                        var numberOfPages = otherPages.length -1; // -1 because the last one is duplicated...
                        var gatheredPages = 0;
                        for(var i = 0; i < numberOfPages; i++){
                            console.log(otherPages[i].href);
                            self.getAditionalSearchResults(otherPages[i].href,function(results){
                                //toReturn.concat(results);//this doesn't work, do it manually instead
                                for(var j = 0 ; j < results.length; j++){
                                    toReturn.push(results[j]);
                                }
                                gatheredPages++;
                                if(gatheredPages === numberOfPages){
                                    console.log('done');
                                    self.prototype.returnJSON(toReturn);
                                }
                            });
                        }
                    }else {
                        self.prototype.returnJSON(toReturn);
                    }
                } else{
                    console.log(errors);
                    self.prototype.returnJSON(toReturn);
                }
            }
        );
    }
}

MovieController.prototype.getAditionalSearchResults = function(url,callback){
    var self = this;
    jsdom.env(
        url,
        ["http://code.jquery.com/jquery.js"],
        function(errors,window){
            if(!errors){
                callback(self.extractSearchResultsFromHtml(window.$));
            }
        });
}

MovieController.prototype.extractSearchResultsFromHtml = function($){
    var toReturn = [];
    var links = $('.index_item a');
    links = cleanupLinks(links);
    var images = $('.index_item a img');
    var titles = cleanupTitles($('.index_item a h2').text());
    for(var i = 0; i < links.length; i++){
        var curMov = {};
        curMov.title = titles[i];
        curMov.link = links[i];
        if(images[i] !== undefined){
            curMov.image = images[i].src;
        }
        toReturn.push(curMov);
    }
    return toReturn;
}

function cleanupLinks(links){
    var toReturn = [];
    for(var i = 0; i < links.length; i++){
        if(links[i].href.indexOf('?genre=') === -1){
            toReturn.push(links[i].href);
        }
    }
    return toReturn;
}

function cleanupTitles(titleString){
    return titleString.match(/[A-Z0-9\( \.\'\"]*\)/gi);
}

MovieController.prototype.doLinks = function(){
    var self = this;
    var id = self.reformatIdToUrl(self.prototype.ctx.routeObj.id);
    var url = 'http://www.primewire.ag/' + id;
    url += self.prototype.ctx.routeObj.extra !== undefined ? '/' + self.prototype.ctx.routeObj.extra : '';
    jsdom.env(
        url,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window){
            $ = window.jQuery;
            var toReturn = {type:'links', links : []};
            if($('.tv_container').length === 0) {
                console.log('movie link ....');
                $('.movie_version').each(function () {
                    //check of not sponsored link
                    var host = $(this).find('.version_host').text()
                    if (host.indexOf('Promo Host') === -1 && host.indexOf('Sponsor Host') === -1) {
                        var movie = {};
                        movie.url = 'http://www.primewire.ag' + $(this).find('a').attr('href');
                        var score = $(this).find('.current-rating').text();
                        score = score.replace(/Currently |\/5/gi, '');
                        var votes = $(this).find('.voted').text();
                        movie.votes = votes.replace(/\(|\)| votes| vote/gi, '');
                        movie.host = host.replace(/document.writeln\(\'|\'\);/gi, '');
                        movie.score = score;
                        toReturn.links.push(movie);
                    }
                });
                //sort by score
                toReturn.links.sort(function (a, b) {
                    if (a.score > b.score) {
                        return -1;
                    } else if (a.score < b.score) {
                        return 1;
                    } else {
                        //equal score order by votes
                        if (a.votes > b.votes) {
                            return -1;
                        } else if (a.votes < b.votes) {
                            return 1;
                        } else {
                            //equal score and votes
                            return 0;
                        }
                    }

                });
                toReturn.links = removeForbiddenLinks(toReturn.links);
                self.prototype.returnJSON(toReturn);
            }else{
                //tv show get seasons and series...
                self.getEpisodes($);
            }
        }
    );
}

function removeForbiddenLinks(links){
    var toReturn = [];
    for(var j = 0; j < links.length; j++) {
        for (var i = 0; i < Settings.sitesToIgnore.length; i++) {
            if(links[j].host.indexOf(Settings.sitesToIgnore[i]) === -1) {
                toReturn.push(links[j]);
            }
        }
    }
    console.log(toReturn);
    return toReturn;
}


MovieController.prototype.getEpisodes = function($){
    var self = this;
    var toReturn = {type:'episodes',seasons:[]};
    var seasons = $('div.show_season');
    seasons.each(function(){
        var season = {};
        season.season = $(this).attr('data-id');
        season.episodes = [];
        $(this).find('.tv_episode_item').each(function(){
            var episode = {};
            episode.url = $(this).find('a').attr('href');
            episode.number = $(this).find('a').text();
            episode.number = episode.number.match(/E[0-9]+/)[0];
            episode.name = $(this).find('.tv_episode_name').text();
            episode.name = episode.name.replace(' - ','');
            episode.airdate = $(this).find('.tv_episode_airdate').text();
            episode.airdate = episode.airdate.replace(' - ','');
            season.episodes.push(episode);
        });
        toReturn.seasons.push(season);
    });
    self.prototype.returnJSON(toReturn);
}

MovieController.prototype.reformatIdToUrl = function(id){
        return id.replace('-season','/season');
}