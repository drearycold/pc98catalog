/**
 * Simframe Font Resizer.js
 * Author: kazuhiro iizuka
 * $Id: font_resizer.js,v 1.1 2008/03/19 03:18:27 oogou Exp $
 */

if( typeof(Cookie)==="undefined" ){
  throw("font_resizer.js requires cookie.js library.");
}

var FontResizer = Class.create();
FontResizer.prototype = {
  types: ["xx-small","x-small","small","medium","large","x-large","xx-large"],
  original: null,
  diff: 0,
  max_size: 0,
  min_size: 0,
  initialize: function(id,options){
    this.id = id;
    this.options = Object.extend({
//      change: 0.125,
      change: 0.2,
      range: 2,
      cookie: {key:'font-resizer'} // cookie options or false
    },options||{});

    Event.observe($(this.id+"-large"),'click',this.Resize.bindAsEventListener(this,'large'),false);
    Event.observe($(this.id+"-reset"),'click',this.Resize.bindAsEventListener(this,'reset'),false);
    Event.observe($(this.id+"-small"),'click',this.Resize.bindAsEventListener(this,'small'),false);

    this.original = Element.getStyle(document.body,'fontSize');
    var unit = this.FindUnit(this.original);
    if( typeof(unit)=="undefined" ){
      var current_font_size = this.original;
    }else{
      var current_font_size = this.original.replace(/[a-z%]/g,'');
    }

    if( this.options.range ){
      this.max_size = this.GetLargerFontSize(current_font_size,unit,this.options.range);
      this.min_size = this.GetSmallerFontSize(current_font_size,unit,this.options.range);
    }
//alert("original="+this.original+",current_font_size="+current_font_size+",max_size="+this.max_size+",min_size="+this.min_size);

    if( this.options.cookie ){
      this.cookie = new Cookie();
      this.diff = this.cookie.get(this.options.cookie.key)||0;


//this.diff = 0;
      if( this.diff ){
//alert("original="+original+",unit="+unit);

	var font_size;
	if( typeof(unit)==="undefined" ){
	  font_size = this.diff;
	}else{
	  current_font_size = this.original.replace(/[a-z%]/g,'');
	  this.diff = parseFloat(this.diff);
	  font_size = Math.ceil((1+this.diff)*current_font_size)+unit;
//debug("[COOKIE]"+this.diff+",font="+font_size);
	}

//alert("init[A8]"+this.original+" => "+font_size);

	Element.setStyle(document.body,{"fontSize":font_size});
      }
    }
  },
  FindUnit: function(size){
    var units = ["%","px","em","pt","ex","in","cm","mm","pt","pc"];
    for(var i=0;i<units.length;i++){
      if( size.indexOf(units[i])>0 ){
	return units[i];
      }
    }
  },
  GetLargerFontSize: function(font_size,unit,times){
    times = times||1;
//alert("[GetLargerFontSize]"+font_size+","+unit+","+times);
    for(var i=0;i<times;i++){
      if( typeof(unit)=="undefined" ){
	for(var j=0;j<this.types.length-1;j++){
//alert("CMP("+this.types[j]+","+font_size+")");
	  if( this.types[j]==font_size || (this.max_size && this.types[j+1]==this.max_size) ){
	    font_size = this.types[j+1];
	    break;
	  }
	}
	this.diff = font_size;
      }else{
	font_size = Math.ceil((1+this.options.change)*font_size);
	this.diff += this.options.change;
      }
    }
//alert("[GetLargerFontSize]"+font_size);
    if( typeof(unit)=="undefined" ){
      return font_size;
    }else{
      return font_size+unit;
    }
  },
  GetSmallerFontSize: function(font_size,unit,times){
    times = times||1;
    for(var i=0;i<times;i++){
      if( unit ){
  //      font_size = Math.ceil((1-this.options.change)*font_size)+unit;
	font_size = Math.floor((1-this.options.change)*font_size);
	this.diff -= this.options.change;
      }else{
	for(var j=1;j<this.types.length;j++){
	  if( this.types[j]==font_size || (this.min_size && this.types[j-1]==this.min_size) ){
	    font_size = this.types[j-1];
	    break;
	  }
	}
	this.diff = font_size;
      }
    }
    if( typeof(unit)=="undefined" ){
      return font_size;
    }else{
      return font_size+unit;
    }
    return font_size;
  },


  Resize: function(evt,size){
    Event.stop(evt);

    var current_font_size = Element.getStyle(document.body,'fontSize');
    var unit = this.FindUnit(current_font_size);
    var font_size;

  //debug("current_font_size="+current_font_size+"unit="+unit);
    if( unit ){
      current_font_size = current_font_size.replace(/[a-z%]/g,'');
    }
//alert("[Resize]current_font_size="+current_font_size+",unit="+unit);

    switch(size){
    case 'large':
      font_size = this.GetLargerFontSize(current_font_size,unit);
      break;
    case 'reset':
      font_size = this.original;
      if( unit ){
	this.diff = 0;
      }else{
	this.diff = font_size;
      }
      break;
    case 'small':
      font_size = this.GetSmallerFontSize(current_font_size,unit);
      break;
    }
    if( this.options.range ){
      if( typeof(unit)!='undefined' ){
	if( parseFloat(font_size)>parseFloat(this.max_size) ){
  //alert("out of range[too large]"+font_size+","+this.max_size);
	  return false;
	}
	if( parseFloat(font_size)<parseFloat(this.min_size) ){
  //alert("out of range[too small]"+font_size+","+this.min_size);
	  return false;
	}
      }
    }

//alert("[Resize]font_size="+font_size+",unit="+unit+",diff="+this.diff);
  //    font_size+=unit;
  //debug("font_size="+font_size+","+this.diff);
    if( this.options.cookie ){
      this.cookie.set(this.options.cookie.key,this.diff);
    }


    Element.setStyle(document.body,{fontSize:font_size});
    return false;
  }
};

