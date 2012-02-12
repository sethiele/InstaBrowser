$(function(){
    if(location.pathname == "/popup.html"){
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
    }else if(location.pathname == "/options.html"){
        $('.action-saved').html(chrome.i18n.getMessage("opt_action_saved"));
        $('#remove-connection').html(chrome.i18n.getMessage("opt_removeaccess_lb"));
        $('#remove-connection-desc').html(chrome.i18n.getMessage("opt_removeaccess_desc"));
        $('#remove-access').val(chrome.i18n.getMessage("opt_removeaccess_btn"));
        $('#imageinfo').html(chrome.i18n.getMessage("opt_imageinfo_lb"));
        $('#imageinfo-desc').html(chrome.i18n.getMessage("opt_imageinfo_desc"));
        $('#insta-options').html(chrome.i18n.getMessage("opt_insta_options", "InstaBrowser"));
        $('#translationinfo').html(chrome.i18n.getMessage("opt_translation_ln"));
        $('#translation-desc').html(chrome.i18n.getMessage("opt_translation_desc"));
    }
});