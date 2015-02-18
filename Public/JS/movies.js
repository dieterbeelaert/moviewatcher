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
    $('#frmMovie')[0].setAttribute('width',$(window).width());
    $('#frmMovie')[0].setAttribute('height',$(window).height());
    $(document).on('click', '#btnSearch',doSearch);
    $(document).on('click', '.movieItem', getMovieLinks);
    $(document).on('click','#btnNext',nextMovie);
}

function doSearch(){
    var txt = $('input[name=txtMovie]').val();
    if(txt != '') {
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

function showMovies(json){
    $('#frmMovie').hide(400);
    $('#movieList').hide();
    $('#movieList').html('');
    var itemsInRow = 0
    for(var i = 0; i < json.length; i++){
        var toAppend = '';
        if(itemsInRow === 3){
            toAppend += '<div class="row">'
        }

        toAppend = '<div class="col-md-2 col-sm-2">';
        var id = json[i].link+'';
        id = id.replace('http://www.primewire.ag','');
        toAppend += '<a href="#" movieId="' + id + '" class="movieItem">'
        toAppend += '<img src="' + json[i].image + '"/></a>';
        toAppend += '</div>';
        if(itemsInRow === 3){
            toAppend+= '</div><div class="spacer"></div>'
            itemsInrow = 0;
        }else{
            itemsInRow++;
        }
        $('#movieList').append(toAppend);
        $('#movieList').show(400);
    }
}

function getMovieLinks(){
    var id = $(this).attr('movieId');
    $('#movieList').hide();
    $.ajax({
        url:'/movie/links' + id,
        success:function(json){
            links = JSON.parse(json);
            console.log(links);
            startMovie(0);
        },
        error: function(err){
            console.log(err)
        }
    });
}

function startMovie(index){
    linkIndex = index;
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
