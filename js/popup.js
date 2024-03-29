var APIURL = 'https://api.instagram.com/v1';
var now = new Date();
var Scrollpoint = 0;

var instaAuth = new OAuth2('instagram', {
  client_id: client_id,
  client_secret: client_secret,
  api_scope: api_scope
});


var trackClick = function(category, action, what) {
    _gaq.push(['_trackEvent', category, action, what]);
};

var getTimeFormat = function(timeval){
	b = timeval.getHours(); 
	c = timeval.getMinutes();
	if(b < 10){b = '0'+b;} 
	if(c < 10){c = '0'+c;} 
	return b+':'+c;
}
var openLink = function(link){
	chrome.tabs.create({
      'url':link,
      'selected':true
    });
	window.close();
}

var displayUser = function(nickname, uid, classname, fullname){
	if(fullname){
		fullname = ' (' + fullname + ') ';
	} else fullname = '';
	return '<b class="username ' + classname + '" data-uid="' + uid + '">' + nickname + fullname + '</b>';
}

var uname2Id = function(username){
    var uid = '';
    $.ajax({
		url: APIURL + "/users/search",
		async: false,
		data: "access_token=" + instaAuth.getAccessToken() + "&q=" + username,
		success: function(users){
		    $.each(users.data, function(lfd, user){
		        if(username == user.username){
		            uid = user.id;
		        }
	        });
	    }
	});
	return uid;
}


var computeContent = function(text){
	text = text.replace(/#(\S*)/g,'<a class="hash" href="#" data-hash="$1">#$1</a>');
	text = text.replace(/@(\S*)/g,'<a class="cusername" href="#" data-uname="$1">@$1</a>');
	return text;
}

var sendFav = function(id, who){
	$.ajax({
		type: 'POST',
		url: APIURL + "/media/" + id + "/likes",
		data: "access_token=" + instaAuth.getAccessToken(),
		success: function(msg){
			if(msg.meta.code == 200) {
				$(who).removeClass('unlike').addClass('like').html(chrome.i18n.getMessage("content_unlike")).data('likestat', 'like');
			}
		}
	});
}

var remFav = function(id, who){
	$.ajax({
		type: 'DELETE',
		url: APIURL + "/media/" + id + "/likes?access_token=" + instaAuth.getAccessToken(),
		success: function(msg){
			if(msg.meta.code == 200) {
				$(who).removeClass('like').addClass('unlike').html(chrome.i18n.getMessage("content_like")).data('likestat', 'unlike');
			}
		}
	});
}

var showLoader = function(){
	$('#images').html('<img src="/img/loader.gif" id="loader" />');
}

var followstatus = function(uid){
    $.ajax({
		url: APIURL + "/users/" + uid + "/relationship",
		data: "access_token=" + instaAuth.getAccessToken(),
		success: function(msg){
		 	console.log(msg);
		 	var followin = '';
		 	var followout = '';
		 	if(msg.data.incoming_status == 'followed_by'){
		 	    followin = chrome.i18n.getMessage("content_followsyou");
		 	} else if(msg.data.incoming_status == 'requested_by'){
		 	    followin = chrome.i18n.getMessage("content_pendingfreq");
		 	} else if(msg.data.incoming_status == 'blocked_by_you'){
		 	    followin = chrome.i18n.getMessage("content_blocking");
		 	} else if(msg.data.incoming_status == 'none') {
                followin = chrome.i18n.getMessage("content_nofollow");
		 	} else {
		 	    followin = msg.data.incoming_status;
		 	}
		 	
		 	if(msg.data.outgoing_status == 'follows'){
		 	    followout = chrome.i18n.getMessage("content_following");
		 	} else if(msg.data.outgoing_status == 'requested'){
		 	    followout = chrome.i18n.getMessage("content_waitfollow");
		 	} else if(msg.data.outgoing_status == 'none'){
		 	    followout = '<a href="#" class="addfriend" data-uid="' + uid + '">' + chrome.i18n.getMessage("content_follow") + '</a>';
		 	} else {
		 	    followout = msg.data.outgoing_status;
		 	}
		 	
		 	$('#incoming_follow').html(followin);
		 	$('#outcoming_follow').html(followout);
		}
	});
}

var showUser = function(uid){
    var requestURL = APIURL + "/users/self";
    if(uid) {
        requestURL = APIURL + "/users/"+uid;
        $('#followstatus').show();
        followstatus(uid);
    } else {
        $('#followstatus').hide();
    }
	$.ajax({
		url: requestURL,
		data: "access_token=" + instaAuth.getAccessToken(),
		success: function(msg){
		 	$('#mename').html(displayUser(msg.data.username, msg.data.id, 'itsme', msg.data.full_name));
			$('#photocount').html(msg.data.counts.media);
			$('#followedbycount').html(msg.data.counts.followed_by);
			$('#followscount').html(msg.data.counts.follows);
			$('#meimg').attr('src', msg.data.profile_picture)
		}
	});
}

var myStream = function(){
    readStream();
    showUser();
    $('#searchbox').val('');
}

var buildAuthor = function(caption){
    if(!caption) return ''
    var pTime = new Date();
	pTime.setTime(caption.created_time * 1000);
	
    return '<table class="meta">' +
		'<tr>' +
			'<td class="from-image"><img src="' + caption.from.profile_picture + '" height="20px" width="20px"/></td>' +
			'<td>' + displayUser(caption.from.username, caption.from.id, 'owner', caption.from.full_name) + '</td>' +
			'<td class="from-time">' + pTime.getDate() + '.' + (pTime.getMonth()+1) + '.' + (pTime.getYear()+1900) + ' ' + getTimeFormat(pTime) + '</td>' +
		'</tr>' +
	'</table>';
}

var buildImage = function(link, imageData){
    return '<a href="' + link + '" target="_blank">' +
		'<img src="' + imageData.low_resolution.url + '" width="' + imageData.low_resolution.width + 'px" height="' + imageData.low_resolution.height + 'px" class="instagramimage" />' + 
	'</a>'
}

var buildLikes = function(likes){
    var liker = '';
    var likecount = likes.data.length;
    $.each(likes.data, function(lid, lval){
		liker += displayUser(lval.username, lval.id, 'liker');
		if(lid < likecount-1) liker  += ', ';
	});
    
    return '<ul class="likes">' +
		'<li>' + likes.count + ': ' + liker + '</li>' +
	'</ul>';
}

var buildComments = function(caption, comments, photoid){
    var uComments = '';
    var ret = '';
	
    ret = '<ul class="comments" id="comments' + photoid + '">'
        if (caption)
		{
            ret += '<li class="upload-comment">' +
                displayUser(caption.from.username, caption.from.id, 'commenter authorcomment') +' ' + computeContent(caption.text) +
            '</li>'
		}
        $.each(comments.data, function(cid, cval){
            ret += '<li class="user-comment">' + 
                displayUser(cval.from.username, cval.from.id, 'commenter') + ' ' + computeContent(cval.text) + 
            '</li>';
        });
	ret += '</ul>';
	
	return ret;
}

var sendComment = function(photoid, comment){
    console.log('SEND', comment);
    var username = '';
    var uid = '';

    $.ajax({
         url: APIURL + "/users/self",
         async: false,
         data: "access_token=" + instaAuth.getAccessToken(),
         success: function(msg){
            username = msg.data.username;
            uid = msg.data.id;
         }
     });
    
    $.ajax({
         type: 'POST',
         url: APIURL + "/media/" + photoid + "/comments",
         data: "access_token=" + instaAuth.getAccessToken() + '&text=' + comment,
         success: function(msg){
             if(msg.meta.code == 200) {
                 console.log('send OK');
                 $('#commentfield-' + photoid).val('');
                 $('#writecomment-' + photoid).hide();
                 $('#comments' + photoid).append('<li class="user-comment">' + 
                     displayUser(username, uid, 'commenter') + ' ' + computeContent(comment) + 
                 '</li>')
             }
             $('#writecomment-' +photoid + ' .submitcomment').val('Submit').removeAttr("disabled");
         }
     });
}

var fadeOut = function(){
    setTimeout(function(){$('#infofield').slideUp( 'slow' )}, 5000);
}

var sendFollowUnfollow = function(uid, action){
    console.log(uid, action);
    $.ajax({
         type: 'POST',
         url: APIURL + "/users/" + uid + "/relationship",
         data: "access_token=" + instaAuth.getAccessToken() + '&action=' + action,
         success: function(msg){
             if(msg.meta.code == 200) {
                 $('#infofield').html('Following request was send.');
                 $('#outcoming_follow').html('You are a follower');
                 $('#infofield').slideDown( 'slow', fadeOut );
             }
         }
     });
}

var rateme = function(){
    $('body').append('<div id="rate-it" title="' + chrome.i18n.getMessage("rate_me") + '">' +
		'<p>' +
			chrome.i18n.getMessage("rate_first") +
		'</p>' +
		'<p>' +
		    chrome.i18n.getMessage("rate_secound") +
		'</p>' +
		'<div class="rate" id="ratenow">' + chrome.i18n.getMessage("rate_now") + '</div>' +
		'<div class="rate" id="asklater">' + chrome.i18n.getMessage("rate_later") + '</div>' +
		'<div class="rate" id="dontask">' + chrome.i18n.getMessage("rate_never") + '</div>' +
	'</div>');
}

var popular = function(){
    trackClick('Popular', 'show');
    $('#headline').html('Popular stuff');
    readStream('/media/popular');
    
}

var readStream = function(getData, sendData, nextUrl){
    
    var requestURL = APIURL + "/users/self/feed";
    
    
    if(!nextUrl)
    {
        showLoader();
        if(getData){
            requestURL = APIURL + getData;
            localStorage.lastGetData    = getData;
        } else {
        }

        if(sendData){
            sendData = '&' + sendData;
            localStorage.lastSendData   = sendData;
        } else {
            sendData = '';
        }   
    } else {
        requestURL = nextUrl;
    }
    
    
    $.ajax({
        url: requestURL,
        data: "access_token=" + instaAuth.getAccessToken() + sendData,
        success: function(msg){
            $('#loader').hide();
    		console.log(msg.data);
    		anz = 0;
    		
    		$.each(msg.data, function(id, value){
    			try{
    				var comments = '';
    				var likes = '';
    				var likeclass = '';
    				var liketext = '';
    				var evenodd = '';
    				var last = '';


    				if(value.user_has_liked == true){
    					likeclass = 'like';
    					liketext = chrome.i18n.getMessage("content_unlike");
    				} else {
    					likeclass = 'unlike';
    					liketext = chrome.i18n.getMessage("content_like");
    				}

    				if(id % 2){
    					evenodd = 'even';
    				} else {
    					evenodd = 'odd';
    				}
    				
    				if( id == msg.data.length -1){
    				    last = 'lastimg';
    				}

    				$('#images').append('<div style="margin-bottom: 5px;" class="imageframe imageframe-' + evenodd + ' img-' + id + ' ' + last + '">' +
    				    //Build Author
    					buildAuthor(value.caption) +
    					
    					//Build Image
    					buildImage(value.link, value.images) +
    					
    					// Build Likes
    					buildLikes(value.likes) +
    					
    					//Build Comments
    					buildComments(value.caption, value.comments, value.id) + 
    					
    					'<div class="favcoment">' +
    						'<a href="" class="' + likeclass + ' likelink" data-image="' + value.id + '" data-likestat="' + likeclass + '">' + liketext + '</a>' +
    						'<a href="#" class="write_comment" data-photoid="' + value.id + '">' + chrome.i18n.getMessage("content_comment") + '</a>' +
    						'<br />' + 
    						'<a href="#" target="_blank" class="sm sm-gpl" onclick="window.open(\'https://plusone.google.com/_/+1/confirm?hl=en&url=' + value.link + '\', \'Share on google+\', \'height=440,width=620,scrollbars=true\');return false;" title="Google+"></a>' +
    						'<a href="#" target="_blank" class="sm sm-fb" onclick="window.open(\'http://www.facebook.com/sharer.php?u=' + value.link + '\', \'Share on facebook\', \'height=440,width=620,scrollbars=true\');return false;" title="Facebook"></a>' +
    						'<a href="#" target="_blank" class="sm sm-tw" onclick="window.open(\'http://twitter.com/share?url=' + value.link + '&amp;via=InstaBrowser&amp;text=&amp;lang=en\', \'Share on twitter\', \'height=225,width=685,scrollbars=true\');return false;" title="Twitter"></a>' +
                            '<a href="#" target="_blank" class="sm sm-pin" onclick="window.open(\'http://pinterest.com/pin/create/button/?url=' + value.link + '&media=' + value.images.standard_resolution.url + '&description=%20via%20InstaBrowser%20for%20Chrome\', \'Share on Pinterest\', \'width=665,height=300\'); return false;" title="Pinterest"></a>' +
    					'</div>' + 
    					'<div class="writecomment" id="writecomment-' + value.id + '">' +
    					    'Write a comment<br />' + 
    					    '<textarea style="width:100%" id="commentfield-' + value.id + '"></textarea>' +
    					    '<input type="button" class="submitcomment" value="Submit" data-photoid="' + value.id + '" style="width:100%" />' +
    					'</div>' +
    				'</div>');
    				anz++;
    			}catch(e){
    				console.log('ERROR', value);
    			}
    		});
    		if(typeof msg.pagination != 'undefined'){
    		    $('#images').append('<div class="loadinfo"><a href="#test" class="loadmore" data-loadmore="' + msg.pagination.next_url + '">' + chrome.i18n.getMessage("content_loadmore") +'</a></div>');
    		    setTimeout(function(){window.scrollTo(0, Scrollpoint); Scrollpoint = 0;}, 800);
    		} else {
    		    $('#images').append('<div class="loadinfo">' + chrome.i18n.getMessage("content_lastimage") +'</div>');
    		}
        }
    });
}


var startFeed = function(){
    readStream();
	
}

//instaAuth.clearAccessToken;

instaAuth.authorize(function() {
	
	
});


showUser();
startFeed();

$(function(){
    
    if(localStorage.lastGetData || localStorage.lastSendData){
        //readStream(localStorage.lastGetData, localStorage.lastSendData);
        $('#lastsave').html('<a href="#" title="' + chrome.i18n.getMessage("head_load_title") + '" onclick="readStream(\'' + localStorage.lastGetData + '\', \'' + localStorage.lastSendData + '\'); trackClick(\'Load last position\', \'show\');">' + chrome.i18n.getMessage("head_load") + '</a>');
    }

    //Last vote check
    if(!localStorage.lastVoteCheck){
        localStorage.lastVoteCheck = now.getTime();
        console.log('first');
    } else if(localStorage.lastVoteCheck != -1){
        if(localStorage.lastVoteCheck > (now.getTime() - 1000 * 60 * 60 * 24 * 14)){
            
        } else {
            rateme();
            
            $( "#rate-it" ).dialog({
                resizable: false,
                height:250,
                modal: true,
                closeOnEscape: false,
                draggable: false
            });
            console.log('show');
            
            $(window).resize(function() {
               $("#rate-it").dialog("option", "position", "center");
           }).scroll(function(){
              $("#rate-it").dialog("option", "position", "center");
          });
        }
    }
    
    
    // Fix position
    $(window).scroll(function() {
        $('#headercontrol').css('top', $(this).scrollTop() + "px");
    });
    
	// Binding
	$('.loadmore').live('click', function(e){
	    e.preventDefault();
	    $('.loadinfo').hide();
	    Scrollpoint = $(window).scrollTop();
	    readStream('','', $(this).data('loadmore'));
	    window.scrollTo(0, $(window).scrollTop());
	});
	
	
	$('.rate').live('click', function(){
        console.log($(this).attr('id')); 
	   
        switch($(this).attr('id')){
            case 'ratenow':
	            console.log('rate');
	            localStorage.lastVoteCheck = -1;
	            trackClick('Rate', 'now');
	            window.open('http://goo.gl/rFcxj', '_blank');
	            break;
	        case 'asklater':
	            console.log('asklater');
	            trackClick('Rate', 'later');
	            localStorage.lastVoteCheck = now.getTime();
	            break;
	        case 'dontask':
	            console.log('dont ask');
	            trackClick('Rate', 'never');
	            localStorage.lastVoteCheck = -1;
	            break;
	   }
	   $( '#rate-it').dialog( "close" );
	});
	
	$('#images .like, #images .unlike').live('click', function(event){
		event.preventDefault();
		var imgID = $(this).data('image');
		console.log($(this).data('likestat'));
		if($(this).data('likestat') == 'like'){
		    trackClick('Photo', 'unlike', imgID);
			remFav(imgID, this);
			console.log('unlike', imgID);
		}else{
		    trackClick('Photo', 'like', imgID);
			sendFav(imgID, this);
			console.log('like', imgID);
		}
	})
	
	$('.username').live('click', function(){
	    trackClick('User', 'show', $(this).data('uid'));
	    $('#headline').html('');
	    showUser( $(this).data('uid') );
        readStream('/users/' + $(this).data('uid') + '/media/recent');
	});
	
	$('.hash').live('click', function(){
	    trackClick('HashTag', 'show', $(this).data('hash'));
	    $('#headline').html('#' + $(this).data('hash'));
	    readStream('/tags/' + $(this).data('hash') + '/media/recent');
	    return false;
	});
	
	$('.cusername').live('click', function(){
        uid = uname2Id($(this).data('uname'));
        trackClick('User', 'show', uid);
        $('#headline').html('');
	    showUser( uid );
        readStream('/users/' + uid + '/media/recent');
	});
	
	$('.write_comment').live('click', function(){
	    $('#writecomment-' + $(this).data('photoid')).show();
	    return false;
	});
	
	$('.submitcomment').live('click', function(){
	    trackClick('Comment', 'submit', $(this).data('photoid'));
	    $('#writecomment-' + $(this).data('photoid') + ' .submitcomment').val('Please Wait').attr("disabled", "true");
        sendComment($(this).data('photoid'), $(this).siblings('textarea').val());
    });
    
    $('.addfriend').live('click', function(){
        trackClick('User','follow', $(this).data('uid'));
        sendFollowUnfollow( $(this).data('uid'), 'follow');
    });
	
	// Search
	$('#searchform').submit(function(event){
	    if( $('#searchbox').val().length > 0 ){
	        var alphaExp = /^[a-zA-Z0-9]+$/;
            if($('#searchbox').val().match(alphaExp)){
                 trackClick('Search', 'search', $('#searchbox').val());
                 readStream('/tags/' + $('#searchbox').val() + '/media/recent');
            }else{
               alert('Only numbers and letters are allowed.');
            }
	        return false;
	    }
	});
});


function getLocation(){
    trackClick('Geo', 'show');
	navigator.geolocation.getCurrentPosition(gotLocation, noLocation);
}
function gotLocation(position){
	var lat = position.coords.latitude;
	var long = position.coords.longitude;
	$('#headline').html('<a href="http://maps.google.com/maps?q=' + lat + ',+' + long + '" target="_blank">lat: ' + lat + ' long: ' + long + '</a>')
	readStream('/media/search', 'lat=' + lat + '&lng=' + long);
}
function noLocation(){
	alert('No location information found.');
}
