$(document).ready(function(){
  var win = require('nw.gui').Window.get();

  win.setMaximumSize(400, 280);
  win.setMinimumSize(400, 280);

  win.width = 400;
  win.height = 280;

  win.setResizable(false);

  win.setBadgeLabel("");

  win.setPosition("center");

  Spirit.listen("spirit-wrapper");
});
