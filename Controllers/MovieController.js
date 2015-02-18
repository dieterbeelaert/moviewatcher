/**
 * Created by dietn on 18/02/15.
 */

var Controller = require('./Controller.js');
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
                    var links = $('.index_item a');
                    links = cleanupLinks(links);
                    var images = $('.index_item a img');
                    for(var i = 0; i < links.length; i++){
                        var curMov = {};
                        curMov.link = links[i];
                        if(images[i] !== undefined){
                            curMov.image = images[i].src;
                        }
                        toReturn.push(curMov);
                    }
                    console.log(toReturn);
                    self.prototype.returnJSON(toReturn);
                } else{
                    console.log(errors);
                }
            }
        );
    }
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

MovieController.prototype.doLinks = function(){
    //TODO check if it's a serie or a movie, if serie select episodes ... else execute normaly
    var self = this;
    console.log('links');
    var url = 'http://www.primewire.ag/' + self.prototype.ctx.routeObj.id;
    jsdom.env(
        url,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window){
            $ = window.jQuery;
            var toReturn = [];
            $('.movie_version').each(function(){
                //check of not sponsored link
                var host = $(this).find('.version_host').text()
                if(host.indexOf('Promo Host') === -1 && host.indexOf('Sponsor Host') === -1) {
                    var movie = {};
                    movie.url = 'http://www.primewire.ag' + $(this).find('a').attr('href');
                    var score = $(this).find('.current-rating').text();
                    console.log(score);
                    score = score.replace(/Currently |\/5/gi, '');
                    movie.host = host;
                    movie.score = score;
                    console.log(movie);
                    toReturn.push(movie);
                }
            });
            //sort by score
            //TODO also sort by number of votes when there is a tie
            toReturn.sort(function(a,b){
                if(a.score > b.score)
                    return -1;
                if(a.score < b.score)
                    return 1;
                return 0;
            });
            self.prototype.returnJSON(toReturn);
        }
    );
}
