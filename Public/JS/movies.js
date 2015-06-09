/**
 * Created by dietn on 18/02/15.
 */

var links = [];
var linkIndex = 0;
var currentSeries;
var currentSeason;
var currentEpisode;


$(document).ready(function(){
    init();
});

function init(){
    $('#frmMovie').hide();
    $("#loading").hide();
    $("#cntEpisodeControls").hide();
    $(document).on('click', '#btnSearch',doSearch);
    $(document).on('click', '.movieItem', getMovieLinks);
    $(document).on('click','#btnNext',nextMovie);
    $(document).on('click','#btnNextEpisode',nextEpisode);
    $(document).on('click','#btnPreviousEpisode',previousEpisode);
    $(document).on('keyup','input[name=txtMovie]',submitSearch);
    setSize();
    $(window).resize(setSize);
    checkQueryString();
}

function doSearch(query){
    //get the correct value and assign it to query string
    var txt;
    if(query != undefined){
        txt = query;
    } else{
        txt = $('input[name=txtMovie]').val();
        setQueryString('search', txt);
    }


    if(txt != '') {
        showLoading(true);
        $('#movieList').hide();
        $.ajax({
            url: '/movie/search/' + txt,
            success: function(json){
                showMovies(JSON.parse(json));
            },
            error: function(err){
                console.log(err);
            }
        });
        $('input[name=txtMovie]').val('');
    }else {
        alert('please type a query');
    }
    currentSeries = undefined;
}

function submitSearch(e){
    var code = e.keyCode || e.which;
    if(code === 13){
        doSearch();
    }
}

function showMovies(json){
    $('#frmMovie').hide(400);
    $('#movieList').hide();
    $('#movieList').html('');
    console.log(json.length + ' is the length of the results');
    if(json.length > 0) {
        for (var i = 0; i < json.length; i++) {
            var toAppend = '<div clas="row">';
            //toAppend = '<div class="col-lg-2 col-md-2 col-sm-4 col-xs-6">';
            toAppend = '<div style="text-align:center" class="col-lg-3 col-md-3 col-sm-6 col-xs-12">';
            var id = json[i].link + '';
            id = id.replace('http://www.primewire.ag', '');
            toAppend += '<a href="#" movieId="' + id + '" class="movieItem">';
            toAppend += '<img style="width:75%" src="' + json[i].image + '"/><br/>';
            toAppend += json[i].title + '</a>';
            toAppend += '</div>';
            toAppend += '</div>';
            $('#movieList').append(toAppend);
            showLoading(false);
            $('#movieList').show(400);
        }
    } else{
        $('#movieList').html('<h2>Nothing found, please try again</h2>').show(400);
        showLoading(false);
    }
}

function getMovieLinks(movieId){

    //check if this is called from query string or from clickhandler
    var id;
    if(movieId != undefined && typeof movieId !== 'object'){
        id = '/'+ movieId;
    }else{
        console.log('movieId is undefined');
        id = $(this).attr('movieId');
        setMovieIdInQueryString(id);
        currentSeason = $(this).attr('season');
        currentEpisode = $(this).attr('episode');
    }

    $('#movieList').hide();
    getEpisodeLinks(id);
}

function getEpisodeLinks(id){
    showLoading(true);
    $.ajax({
        url:'/movie/links' + id,
        success:function(json){
            //series or movie?
            json = JSON.parse(json);
            console.log(json);
            if(json.type === 'links'){
                links = json.links;
                startMovie(0);
                if(currentSeries === undefined){
                    $("#cntEpisodeControls").hide(200);
                }
            }else if(json.type === 'episodes'){
                currentSeries = json.seasons;
                displayEpisodes(json.seasons);
                $("#cntEpisodeControls").show(200);
            }

        },
        error: function(err){
            console.log(err)
        }
    });
}

function displayEpisodes(seasons){
    $('#frmMovie').hide();
    $('#movieList').html('');
    var toAppend = ''
    for(var s = 0 ;  s < seasons.length; s++){
        toAppend += '<h2>Season ' + seasons[s].season + '</h2>';
        toAppend += '<ul class="list-group">';
        for(var e = 0; e < seasons[s].episodes.length; e++){
            var id = seasons[s].episodes[e].url;
            var epNumber = seasons[s].episodes[e].number.replace(/E/gi,'') -1;
            toAppend += '<li class="list-group-item">' + seasons[s].episodes[e].number;
            toAppend += ' <a href="#" class="movieItem" movieId="' + id +'" season="'+s+'" episode="'+ epNumber +'">';
            toAppend += seasons[s].episodes[e].name + ' ';
            toAppend += '<small> ' + seasons[s].episodes[e].airdate + '</small></a></li>';
        }
        toAppend +='</ul>';
    }
    $('#movieList').append(toAppend);
    showLoading(false);
    $('#movieList').show();
}

function startMovie(index){
    linkIndex = index;
    showLoading(false);
    if(links[linkIndex] !== undefined) {
        $('#frmMovie').show();
        $('#frmMovie')[0].setAttribute('src', links[linkIndex].url);
    } else{
        $('#movieList').html('<h2>Something went wrong, we\'re so so sorry</h2>').show(400);
    }
}

function nextMovie(){
    if(linkIndex+1 < links.length) {
        startMovie(linkIndex + 1);
    }else{
        alert('Ran out of links, I am so sorry');
    }
}

function showLoading(show){
    if(show){
        $("#loading").show();
    }else{
        $("#loading").hide();
    }
}

function setSize(){
    $('#frmMovie')[0].setAttribute('width',$(window).width());
    $('#frmMovie')[0].setAttribute('height',$(window).height());
    $('#movieList').css('height', $(window).height());
}

function checkQueryString(){
    var url =window.location.href;
    if(url.indexOf('?') !== -1) {
        var queryString = url.split('?')[1];
        var keys = queryString.match(/[a-z]*=/gi);
        var values = queryString.match(/=[a-z\-[0-9]*]*/gi);
        for(var i = 0; i < keys.length; i++){
            key = keys[i].replace('=','');
            var id = values[i].replace('=','')
            switch(key.toUpperCase()){
                case 'SEARCH': doSearch(id);
                    break;
                case 'ID':
                    //if it's an episode of a series we need to get the other episodes JSON + display controls
                    if(id.indexOf('season') !== -1 && id.indexOf('episode') !== -1){
                        //fill currentSeries
                        var seriesID = id.replace(/-season-[0-9]?-episode-[0-9]?/gi,'');
                        currentSeason = id.match(/-season-([0-9]?)/i)[0].replace(/[a-z]*\-*/gi,'') -1;
                        currentEpisode = id.match(/-episode-([0-9]?)/i)[0].replace(/[a-z]*\-*/gi,'')-1;
                        $.ajax({
                            url: '/movie/links/'+seriesID,
                            success:function(json){
                                currentSeries = JSON.parse(json).seasons;
                                $('#cntEpisodeControls').show(200);
                            },
                            error: function(err){
                                console.log(err);
                            }

                        })
                    }
                    getMovieLinks(id);
                    break;
            }
        }
    }
}

function nextEpisode(){
    console.log(currentSeries);
    if(currentEpisode + 1 < currentSeries[currentSeason].episodes.length){
        currentEpisode++;
    }else{
        currentEpisode = 0;
        if(currentSeason + 1 < currentSeries.length){
            currentSeason++;
        } else {
            currentSeason = 0;
        }
    };
    setMovieIdInQueryString(currentSeries[currentSeason].episodes[currentEpisode].url);
    getEpisodeLinks(currentSeries[currentSeason].episodes[currentEpisode].url);
}

function previousEpisode(){
    if(currentEpisode !== 0){
        currentEpisode--;
    }else if(currentSeason !== 0){
        currentSeason--;
        currentEpisode = currentSeries[currentSeason].episodes.length -1;
    }
    setMovieIdInQueryString(currentSeries[currentSeason].episodes[currentEpisode].url);
    getEpisodeLinks(currentSeries[currentSeason].episodes[currentEpisode].url);
}

function setMovieIdInQueryString(url){
    var val = url.replace('/','');
    val = val.replace('/','-');
    setQueryString('id',val );
}

function setQueryString(key,value){
    window.history.pushState(null,'','?' + key +'=' + value);
}