var gbsb = function() {
    var srv = "blogimg.goo.ne.jp";
    var src = "<img src=\"http://"+srv+"/img/static/blog/mod_social_bookmarks.gif\" width=\"116\" height=\"16\" border=\"0\" alt=\"\" usemap=\"#mod_social_bookmarks_map\">";
    var map = "<map name=\"mod_social_bookmarks_map\"><area shape=\"rect\" alt=\"gooブックマークに追加\" coords=\"0,0,15,15\" href=\"javascript:void(0);\" onclick=\"(window.open('http://bookmark.goo.ne.jp/add/detail/?url='+encodeURIComponent(document.location.href),'_blank','scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=yes,menubar=yes'))\"><area shape=\"rect\" alt=\"はてなブックマークに追加\" coords=\"20,0,35,16\" href=\"javascript:(function(){var%20d=(new%20Date);var%20s=document.createElement('script');s.charset='UTF-8';s.src='http://b.hatena.ne.jp/js/Hatena/Bookmark/let.js?'+d.getFullYear()+d.getMonth()+d.getDate();(document.getElementsByTagName('head')[0]||document.body).appendChild(s);})();\"><area shape=\"rect\" alt=\"Choixに追加\" coords=\"40,0,55,15\" href=\"javascript:void(0);\"onclick=\"(window.open('http://www.choix.jp/submit?bookurl='+encodeURIComponent(window.location.href)+'&amp;title='+encodeURIComponent(document.title)),'_blank')\"><area shape=\"rect\" alt=\"Yahoo!ブックマークに追加\" coords=\"61,0,76,15\" href=\"javascript:void window.open('http://bookmarks.yahoo.co.jp/bookmarklet/showpopup?t='+encodeURIComponent(document.title)+'&amp;u='+encodeURIComponent(window.location.href)+'&amp;opener=bm&amp;ei=UTF-8','popup','width=550px,height=480px,status=1,location=0,resizable=1,scrollbars=0,left=100,top=50',0);\"><area shape=\"rect\" alt=\"livedoorクリップに追加\" coords=\"80,0,95,15\" href=\"javascript:void window.open('http://clip.livedoor.com/clip/add?link='+encodeURIComponent(location.href)+'&amp;title='+encodeURIComponent(document.title), '_blank');\"><area shape=\"rect\" alt=\"newsingに追加\" coords=\"100,0,115,15\" href=\"javascript:void window.open('http://newsing.jp/add?title='+encodeURIComponent(document.title)+'&amp;url='+encodeURIComponent(location.href), '_blank');\"></map>";
    return {
    	get_src: function(){return src;},
    	get_map: function(){return map;}
    };
};
var gbSb = gbsb();
document.write(gbSb.get_map());
