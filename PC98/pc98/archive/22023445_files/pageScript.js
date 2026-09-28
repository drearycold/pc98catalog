/* ウェブページ用スクリプト */

/*
 * 管理者用
 */
function setAdmin() {
	expires = new Date((new Date()).getTime() + (2592000*1000));
	document.cookie = "melog_admin=true; expires=" + expires.toGMTString() + "; path=/;";
}
function adminNavigation(blogID, entryID) {
	if ((document.cookie).indexOf("melog_admin=true") != -1) {
		var elements = document.getElementsByTagName("ul");
		var li = elements[1].appendChild(document.createElement("li"));
		var span = li.appendChild(document.createElement("span"));
		span.className = "admin";
		var a = span.appendChild(document.createElement("a"));
		if (entryID == -1) {
			a.setAttribute("href", "http://melog.info/mt/mt.cgi?__mode=view&amp;_type=entry&amp;blog_id=" + blogID);
			a.appendChild(document.createTextNode("Post"));
		} else {
			a.setAttribute("href", "http://melog.info/mt/mt.cgi?__mode=view&amp;_type=entry&amp;id=" + entryID + "&amp;blog_id=" + blogID);
			a.appendChild(document.createTextNode("Edit"));
		}
		
		setAdmin();
	}
}



/*
 * title属性のポップアップ
 */
function titlePopup() {
	if (document.getElementById) {
		var popElement = "img";
		var popAttribute = "title";
		var popWindow = getPopWindow();
		
		setPopEvent();
		(document.getElementsByTagName("body"))[0].appendChild(popWindow);
	}
	
	// get popup window
	function getPopWindow() {
		var pw = document.createElement("div");
		pw.setAttribute("id", "PopupWindow");
		var pt = pw.appendChild(document.createElement("h5"));
		pt.appendChild(document.createTextNode(popAttribute.toUpperCase()));
		var pc = pw.appendChild(document.createElement("p"));
		pc.appendChild(document.createTextNode(""));
		
		pw.style.fontSize = "80%";
		pw.style.border = "3px double #393";
		pw.style.margin = "0";
		pw.style.padding = "0";
		pw.style.maxWidth = "16em";
		pw.style.position = "absolute";
		pw.style.zindex = "10";
		pw.style.visibility = "hidden";
		pw.firstChild.style.fontWeight = "bold";
		pw.firstChild.textDecoration = "none";
		pw.firstChild.style.backgroundColor = "#9f9";
		pw.firstChild.style.border = "2px #9f9 outset";
		pw.firstChild.style.margin = "0";
		pw.firstChild.style.padding = "0 1ex";
		pw.lastChild.style.backgroundColor = "#fff";
		pw.lastChild.style.margin = "0";
		pw.lastChild.style.padding = "0.2em";
		
		return pw;
	}
	
	// set popup event
	function setPopEvent() {
		var elements = document.getElementsByTagName(popElement);
		var value = "";
		var offset = 10;
		
		for (i = 0; i < elements.length; i++) {
			var v = elements[i].getAttribute(popAttribute);
			
			if ((v != null) && (v != "")) {
				// onmouseover
				elements[i].onmouseover = function() {
					value = this.getAttribute(popAttribute);
					popWindow.lastChild.firstChild.nodeValue = value;
					this.setAttribute(popAttribute, "");
					popWindow.style.visibility = "visible";
				}
				// onmouseout
				elements[i].onmouseout  = function() {
					if (value != "") this.setAttribute(popAttribute, value);
					popWindow.style.visibility = "hidden";
				}
				// onmousemove
				elements[i].onmousemove = function(e) {
					var windowEvent = e || window.event; // Gecko系ブラウザ対策
					popWindow.style.left = (document.body.scrollLeft || document.documentElement.scrollLeft)
						+ windowEvent.clientX + offset + "px";
					popWindow.style.top = (document.body.scrollTop || document.documentElement.scrollTop)
						+ windowEvent.clientY + offset + "px";
				}
//				if (document.all) { // Internet Explorer, Opera
//					elements[i].onmousemove = function() {
//						popWindow.style.left = (document.body.scrollLeft || document.documentElement.scrollLeft)
//							+ event.clientX + offset + "px";
//						popWindow.style.top = (document.body.scrollTop || document.documentElement.scrollTop)
//							+ event.clientY + offset + "px";
//					}
//				} else { // Mozilla, Firefox, Netscape Navigator, Safari
//					elements[i].onmousemove = function(e) {
//						popWindow.style.left = e.pageX  + offset +"px";
//						popWindow.style.top = e.pageY + offset +"px";
//					}
//				}
			}
		}
	}
	
}



/*
 * エントリーコメント用
 */
CommentName = "mtcmtauth";
CommentMail = "mtcmtmail";
CommentHome = "mtcmthome";
Domain = "melog.info";
Path = "/";

// cookie
function setCommentCookie(name, value, expires) {
    document.cookie = name + "=" + escape(value) + "; expires=" + expires  + "; path=" + Path + "; domain=" + Domain;
}

function getCommentCookie(name) {
    var prefix = name + '=';
    var c = document.cookie;
    var nullstring = '';
    var cookieStartIndex = c.indexOf(prefix);
    if (cookieStartIndex == -1)
        return nullstring;
    var cookieEndIndex = c.indexOf(";", cookieStartIndex + prefix.length);
    if (cookieEndIndex == -1)
        cookieEndIndex = c.length;
    return unescape(c.substring(cookieStartIndex + prefix.length, cookieEndIndex));
}

function deleteCommentCookie(name) {
	if (getCommentCookie(name)) {
		document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=" + Path + "; domain=" + Domain;
    }
}

// form
function rememberCommentForm(f) {
	if (f.remember.checked == true) {
		var limit = new Date();
		limit.setYear(limit.getYear() + 1);
		limit = limit.toGMTString();
		
		if (f.author) setCommentCookie(CommentName, f.author.value, limit);
		if (f.email)  setCommentCookie(CommentMail, f.email.value, limit);
		if (f.url)    setCommentCookie(CommentHome, f.url.value, limit);
	}
}

function forgetCommentForm(f) {
	f.author.value = '';
	f.email.value = '';
	f.url.value = '';
	deleteCommentCookie(CommentName);
	deleteCommentCookie(CommentMail);
	deleteCommentCookie(CommentHome);
	f.remember.checked = false;
}

function setCommentForm() {
	document.COMMENT_FORM.author.value = getCommentCookie(CommentName);
	document.COMMENT_FORM.email.value = getCommentCookie(CommentMail);
	document.COMMENT_FORM.url.value = getCommentCookie(CommentHome);
	if (getCommentCookie(CommentName) || getCommentCookie(CommentHome)) {
	    document.COMMENT_FORM.remember.checked = true;
	}
}




