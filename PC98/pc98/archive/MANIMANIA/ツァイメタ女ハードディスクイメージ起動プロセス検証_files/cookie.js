
var Cookie = Class.create();
Cookie.prototype = {
  initialize: function(options){
    this.options = Object.extend({
      expire: 0,// valid util user close the browser.
      path: '/',
      domain: null,
      secure: 0
    },options||{});
  },
  set: function(name,value,expire,path,domain,secure){
    if( typeof(name)=="undefined" ){
      alert("Cookie.prototype.set requires name.");
      return;
    }
    if( typeof(value)=="undefined" ){
      value = "";
    }
    this.name = name;
    this.value = value;
    var attributes = "";
    if( typeof(expire)!="undefined" && expire!=null ){
    }else if( this.options.expire ){
      expire = this.options.expire; 
    }

    // expires
    if( typeof(expire)!="undefined" && expire!=null ){
      if( typeof(expire)=="number" ){
	expire = new Date((new Date()).getTime()+expire*60*60*1000);
	attributes+=";expires="+expire.toUTCString();
      }else if( typeof(expire)=="object" ){
	attributes+=";expires="+expire.toUTCString();
      }else if( typeof(expire)=="string" ){
	attributes+=";expires="+expire;
      }
    }
    // path
    if( typeof(path)!="undefined" && path!=null ){
      attributes+=";path="+path;
    }else if( this.options.path ){
      attributes+=";path="+this.options.path;
    }
    // domain
    if( typeof(domain)!="undefined" ){
      attributes+=";domain="+domain;
    }else if( this.options.domain ){
      attributes+=";domain="+this.options.domain;
    }
    // secure
    if( typeof(secure)!="undefined" ){
      attributes+="secure=1";
    }else if( this.options.secure ){
      attributes+="secure=1";
    }
//if( attributes ){ alert("attributes="+attributes); }
    var cookie = escape(name)+"="+escape(value)+attributes;
    document.cookie = cookie;
  },
  get: function(name){
    var prefix = escape(name)+"=";
    var cookies = (document.cookie||"").split(/;\s*/);
    for(var i=0;i<cookies.length;i++){
      if(cookies[i].indexOf(prefix)>=0){
	return unescape(cookies[i].split(/=/)[1]);
      }
    }
    return undefined;
  },
  remove: function(name,path,domain,secure){
    Cookie.prototype.set(name,"",new Date(0),path,domain,secure);
  }
};


