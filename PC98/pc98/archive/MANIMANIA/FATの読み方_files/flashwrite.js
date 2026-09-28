var FlashWrite = Class.create();
FlashWrite.prototype = {

	initialize: function(movie_url, id, width, height, align){
		this.movie_url = movie_url;
		this.id        = id;
		this.width     = width;
		this.height    = height;
		this.isfunc    = false;

		if( align ){
			this.align = align;
		}else{
			this.align = 'middle';
		}

		this.params = new Array();
	},

	addParam: function(key, value){
		this.params[this.params.length] = {'key': key, 'value': value};
	},

	_create_object_params: function(){
		var s = '';

		s += '<param name="movie" value="'+this.movie_url+'"/>';
		for(i=0; i< this.params.length; i++){
			s += '<param name="'+this.params[i].key+'" value="'+this.params[i].value+'"/>';
		}

		return s;
	},

	_create_embed_params: function(){
		var s = '';

		for(i=0; i< this.params.length; i++){
			s += this.params[i].key+'="'+this.params[i].value+'" ';
		}

		return s;
	},

	_setParams: function(content_id){
		var s = '<div id="'+content_id+'-swf">';

		/* object tag */
		s += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0" width="'
				+this.width+'" height="'+this.height+'" align="'+this.align+'">';
		s += this._create_object_params();

		/* embed tag */
		s += '<embed src="'+this.movie_url+'" '+this._create_embed_params()+
				'name="'+this.id+'" align="'+this.align+'" width="'+this.width+'" height="'+this.height+'" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"></embed>';

		s += '</object>';

		if(this.no_script){
			s += this.no_script;
		}

		s += '</div>';

		return s;
	},

	addFunc: function(name, value){
		this.isfunc = true;

		var func = name + "= new Function('return unescape(\"'+escape(value)+'\")');";

		eval(func);
	},

	write: function(content_id, reverse){
		var s = this._setParams(content_id);
		var tmp_HTML = $(content_id).innerHTML;

		if(this.func){
			document.writeln(this.func);
		}

		if(reverse){
			$(content_id).innerHTML = s+tmp_HTML;
		}else{
			$(content_id).innerHTML = tmp_HTML+s;
		}
	}
};
