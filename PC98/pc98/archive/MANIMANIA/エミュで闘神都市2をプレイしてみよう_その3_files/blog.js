
if(typeof Blog=="undefined" || !Blog){
  var Blog = {};
}

Blog = {
  dialog: null,
  SendMessageDialog: function(user_name){
//alert("SendMessageDialog:"+user_name);
    this.dialog = new Window({title:'メッセージを送る',url:"/popup/blog/send_message?user_name="+user_name,width:'400'});
// for ie7
    if( Prototype.Browser.IE && navigator.userAgent.indexOf('MSIE 7')<=-1 ){
      this.dialog.setDestroyOnClose();
    }
//    this.dialog.getContent().innerHTML = "Send to "+user_name;
    this.dialog.showCenter();
  },
  Cancel: function(){
    this.dialog.close();
  }
};

