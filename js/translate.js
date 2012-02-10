$(function(){
    $('#close').html(chrome.i18n.getMessage("head_close"));
    $('#stream').html(chrome.i18n.getMessage("head_stream"));
    $('#geo').html(chrome.i18n.getMessage("head_geo"));
    $('#popuolar').html(chrome.i18n.getMessage("head_popuolar"));
    $('#logout').html(chrome.i18n.getMessage("head_logout"));
    $('#searchbtn').val(chrome.i18n.getMessage("head_search"));
    $('#photocount_content').html(chrome.i18n.getMessage("user_photocount"));
    $('#followedbycount_content').html(chrome.i18n.getMessage("user_followedbycount"));
    $('#followscount_content').html(chrome.i18n.getMessage("user_followscount"));
    $('#noinstagram').html(chrome.i18n.getMessage("footer_noinstagram"));
    $('#bugreporttwitter').html(chrome.i18n.getMessage("footer_bugreporttwitter", '<a href="http://twitter.com/InstaBrowser" target="_blank">Twitter</a>'));
    $('#followsebastian').html(chrome.i18n.getMessage("footer_followsebastian", ['<a href="#" data-uid="483220" class="addfriend">Instagram</a>', '<a href="https://plus.google.com/100912127446274756364" target="_blank">Google+</a>', '<a href="http://twitter.com/sebat" target="_blank">Twitter</a>']));
});