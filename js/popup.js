var APIURL = 'https://api.instagram.com/v1';

var instaAuth = new OAuth2('instagram', {
  client_id: 'e416342f656d42ceb5e0392d7c7d9a8b',
  client_secret: '77b89ee61294498396a11be3e1646d89',
  api_scope: 'basic+comments+relationships+likes'
});

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

var computeContent = function(text){
	text = text.replace(/#(\S*)/g,'<a class="hash" href="#" data-hash="$1">#$1</a>');
	return text;
}

var sendFav = function(id, who){
	$.ajax({
		type: 'POST',
		url: APIURL + "/media/" + id + "/likes",
		data: "access_token=" + instaAuth.getAccessToken(),
		success: function(msg){
			if(msg.meta.code == 200) {
				$(who).removeClass('unlike').addClass('like').html('Unlike it').data('likestat', 'like');
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
				$(who).removeClass('like').addClass('unlike').html('Like it').data('likestat', 'unlike');
			}
		}
	});
}

var showLoader = function(){
	$('#images').html('<img src="/img/loader.gif" id="loader" />');
}

var showUser = function(uid){
    var requestURL = APIURL + "/users/self";
    if(uid) requestURL = APIURL + "/users/"+uid;
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
    userFeed();
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

var buildComments = function(caption, comments){
    var uComments = '';
    var ret = '';
	
    ret = '<ul class="comments">'
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

var readStream = function(getData){
    showLoader();
    var requestURL = APIURL + "/users/self/feed";
    if(getData){
        requestURL = APIURL + getData;
    }
    $.ajax({
        url: requestURL,
        data: "access_token=" + instaAuth.getAccessToken(),
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


    				if(value.user_has_liked == true){
    					likeclass = 'like';
    					liketext = 'Unlike it';
    				} else {
    					likeclass = 'unlike';
    					liketext = 'Like it';
    				}

    				if(anz % 2){
    					evenodd = 'even';
    				} else {
    					evenodd = 'odd';
    				}

    				$('#images').append('<div style="margin-bottom: 5px;" class="imageframe imageframe-' + evenodd + '">' +
    				    //Build Author
    					buildAuthor(value.caption) +
    					
    					//Build Image
    					buildImage(value.link, value.images) +
    					
    					// Build Likes
    					buildLikes(value.likes) +
    					
    					//Build Comments
    					buildComments(value.caption, value.comments) + 
    					
    					'<div class="favcoment">' +
    						'<a href="" class="' + likeclass + ' likelink" data-image="' + value.id + '" data-likestat="' + likeclass + '">' + liketext + '</a>' +
    						'<a href="#" target="_blank" class="sm sm-gpl" onclick="window.open(\'https://plusone.google.com/_/+1/confirm?hl=en&url=' + value.link + '\', \'Share on google+\', \'height=440,width=620,scrollbars=true\');return false;">&nbsp;</a> ' +
    						'<a href="#" target="_blank" class="sm sm-fb" onclick="window.open(\'http://www.facebook.com/sharer.php?u=' + value.link + '\', \'Share on facebook\', \'height=440,width=620,scrollbars=true\');return false;">&nbsp;</a> ' +
    						'<a href="#" target="_blank" class="sm sm-tw" onclick="window.open(\'http://twitter.com/share?url=' + value.link + '&amp;via=instaChro&amp;text=&amp;lang=en\', \'Share on twitter\', \'height=225,width=685,scrollbars=true\');return false;">&nbsp;</a> ' +
    					'</div>' + 
    				'</div>');
    				anz++;
    			}catch(e){
    				console.log('ERROR', value);
    			}

    		});
        }
    });
}


var userFeed = function(){
	readStream();
}

//instaAuth.clearAccessToken;

instaAuth.authorize(function() {
	
	
});
showUser();
userFeed();

$(function(){
	// Binding
	$('#images .like, #images .unlike').live('click', function(event){
		event.preventDefault();
		var imgID = $(this).data('image');
		console.log($(this).data('likestat'));
		if($(this).data('likestat') == 'like'){
			remFav(imgID, this);
			console.log('unlike', imgID);
		}else{
			sendFav(imgID, this);
			console.log('like', imgID);
		}
	})
	
	$('.username').live('click', function(){
	    $('#headline').html('');
	    showUser( $(this).data('uid') );
        readStream('/users/' + $(this).data('uid') + '/media/recent');
	});
	
	$('.hash').live('click', function(){
	    $('#headline').html('#' + $(this).data('hash'));
	    readStream('/tags/' + $(this).data('hash') + '/media/recent');
	    return false;
	});
	
	// Search
	$('#searchform').submit(function(event){
	    if( $('#searchbox').val().length > 0 ){
	        var alphaExp = /^[a-zA-Z0-9]+$/;
            if($('#searchbox').val().match(alphaExp)){
                 readStream('/tags/' + $('#searchbox').val() + '/media/recent');
            }else{
               alert('Only numbers and letters are allowed.');
            }
	        return false;
	    }
	});
});
