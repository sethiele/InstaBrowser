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
	return '<b class="' + classname + '">' + nickname + fullname + '</b>';
}

var computeContent = function(text){
	text = text.replace(/#(\S*)/g,'<a class="hash" href="http://searchinstagram.com/#$1" target="_blank">#$1</a>');
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

var itsMe = function(){
	$.ajax({
		url: APIURL + "/users/self",
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

var userFeed = function(){
	showLoader();
	$.ajax({
	  url: "https://api.instagram.com/v1/users/self/feed",
	  data: "access_token=" + instaAuth.getAccessToken(),
	  success: function(msg){
		$('#loader').hide();
		console.log(msg.data);
		$.each(msg.data, function(id, value){
			try{
				var pTime = new Date();
				var comments = '';
				var likes = '';
				var likeclass = '';
				var liketext = '';
				var evenodd = '';
				$.each(value.comments.data, function(cid, cval){
					comments += '<div><img src="/img/spechbubble.png" width="10px" height="10px"> ' + displayUser(cval.from.username, cval.from.id, 'commenter') + ' ' + computeContent(cval.text) + '</div>';
				});
				
				$.each(value.likes.data, function(lid, lval){
					likes += displayUser(lval.username, lval.id, 'liker') + ', ';
				});
				
				if(value.user_has_liked == true){
					likeclass = 'like';
					liketext = 'Unlike it';
				} else {
					likeclass = 'unlike';
					liketext = 'Like it';
				}
				
				if(id % 2){
					evenodd = 'even';
				} else {
					evenodd = 'odd';
				}
			
				pTime.setTime(value.caption.created_time * 1000);
				$('#images').append('<div style="margin-bottom: 5px;" class="imageframe imageframe-' + evenodd + '">' +
					'<table class="meta">' +
						'<tr>' +
							'<td class="from-image"><img src="' + value.caption.from.profile_picture + '" height="20px" width="20px"/></td>' +
							'<td>' + displayUser(value.caption.from.username, value.caption.from.id, 'owner', value.caption.from.full_name) + '</td>' +
							'<td class="from-time">' + pTime.getDate() + '.' + (pTime.getMonth()+1) + '.' + (pTime.getYear()+1900) + ' ' + getTimeFormat(pTime) + '</td>' +
						'</tr>' +
					'</table>' +
					'<a href="' + value.link + '" target="_blank">' +
						'<img src="' + value.images.standard_resolution.url + '" width="300px" height="300px" class="instagramimage" />' + 
					'</a>' +
					'<div class="likes">' +
						'<img src="/img/heart.png" width="10px" height="10px"> ' + value.likes.count + ': ' + likes + 
					'</div>' +
					'<div class="comments">' +
						'<div>' +
							'<img src="/img/spechbubble.png" width="10px" height="10px"> ' + displayUser(value.caption.from.username, value.caption.from.id, 'commenter authorcomment') +' ' + computeContent(value.caption.text) +
							comments +
						'</div>' +
					'</div>' + 
					'<div class="favcoment">' +
						'<a href="" class="' + likeclass + ' likelink" data-image="' + value.id + '" data-likestat="' + likeclass + '">' + liketext + '</a>' +
						'<a href="https://plusone.google.com/_/+1/confirm?hl=en&url=' + value.link + '" target="_blank" class="sm sm-gpl">&nbsp;</a> ' +
					'</div>' + 
				'</div>');
			}catch(e){
				
			}
			
		});
	 }
	});
}

//instaAuth.clearAccessToken;

instaAuth.authorize(function() {
	
	
});
itsMe();
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
});
