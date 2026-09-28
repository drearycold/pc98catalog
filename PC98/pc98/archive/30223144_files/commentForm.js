/*
 *  entry form
 */

document.writeln('<input type="checkbox" tabindex="5" id="remember" name="remember" /> <label for="remember">Remember</label><br /><input type="button" value="Delete" tabindex="6" id="forget" name="forget" onclick="forgetCommentForm(this.form)" onkeypress="forgetCommentForm(this.form)" />');
