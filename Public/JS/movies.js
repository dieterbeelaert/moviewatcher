/**
 * Created by dietn on 18/02/15.
 */

var links = [];
var linkIndex = 0;

$(document).ready(function(){
    init();
});

function init(){
    $('#frmMovie').hide();
    $("#loading").hide();
    $('#frmMovie')[0].setAttribute('width',$(window).width());
    $('#frmMovie')[0].setAttribute('height',$(window).height());
    $(document).on('click', '#btnSearch',doSearch);
    $(document).on('click', '.movieItem', getMovieLinks);
    $(document).on('click','#btnNext',nextMovie);
    $(document).on('keyup','input[name=txtMovie]',submitSearch);
}

function doSearch(){
    var txt = $('input[name=txtMovie]').val();
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
    for(var i = 0; i < json.length; i++){
        var toAppend = '<div clas="row">';
        toAppend = '<div class="col-lg-2 col-md-2 col-sm-4 col-xs-6">';
        var id = json[i].link+'';
        id = id.replace('http://www.primewire.ag','');
        toAppend += '<a href="#" movieId="' + id + '" class="movieItem">'
        toAppend += '<img src="' + json[i].image + '"/></a>';
        toAppend += '</div>';
        toAppend+='</div>';
        $('#movieList').append(toAppend);
        showLoading(false);
        $('#movieList').show(400);
    }
}

function getMovieLinks(){
    var id = $(this).attr('movieId');
    console.log(id);
    $('#movieList').hide();
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
            }else if(json.type === 'episodes'){
                console.log(json.seasons);
                displayEpisodes(json.seasons);
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
            toAppend += '<li class="list-group-item">' + seasons[s].episodes[e].number;
            toAppend += ' <a href="#" class="movieItem" movieId="' + id +'">';
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
    $('#frmMovie').show();
    $('#frmMovie')[0].setAttribute('src',links[linkIndex].url);
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
