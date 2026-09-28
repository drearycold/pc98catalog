if(typeof Prototype=='undefined'){throw("click_count.js required prototype.js");}
if(typeof(click_count_id)==='undefined'){click_count_id = new Array();}

var ClickCount = {
    clickcount: function (event,id) {
	var item = Event.element(event);
	var url    = item.href;
	var src    = item.src;
	var target = item.getAttribute('target');
	var delegate = false;

        // for webkit browser(safari,chrome, etc)
	if (Prototype.Browser.WebKit) {
	    delegate = true;
	}

        // find href-value in parent element at once.(case of image with href in parent element)
        // for ie(ie return href-value as clicked image src value)
	if(typeof(url)==='undefined' || url==src){
	    url = item.parentNode.href;
	    target = item.parentNode.target;
	}

	if ( url ) {
	    if(!url.match(/^http/i)){
		return;
	    }

	    if(delegate===true){
		event.stop();
	    }

	    var params = "type=clickcount&id=" + encodeURIComponent(id) + "&url=" + encodeURIComponent(url);
	    var ajax = new Ajax.Request("/ac.php",{
		method:"get",
		parameters:params,
		requestHeaders: ['If-Modified-Since','Wed, 15 Nov 1995 00:00:00 GMT'],
		onComplete: function() {ClickCount.jump(url,delegate,target);},
		onException: function() {ClickCount.jump(url,delegate,target);}
	    });
	}
    },
    jump: function(url,delegate,target) {
	if(delegate===false){
	    return;
	}
	switch(target){
	    case "_blank":
	        window.location.href = url;
//	        window.open(url);
	        break;
	    default:
	        window.location.href = url;
	        break;
	}
    }
};

click_count_id.each(function(current_id){
    if($(current_id)===null){
// if there isn't specified element in this page, do nothing.
    }else{
	$(current_id).observe('click', ClickCount.clickcount.bindAsEventListener(ClickCount, current_id));
    }
});
