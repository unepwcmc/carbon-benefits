// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery-ui
//= require jquery_ujs
//= require_tree ./templates
//= require libs/jquery.mousewheel
//= require libs/jquery.jscrollpane
//= require libs/underscore
//= require libs/class
//= require libs/backbone
//= require libs/jquery.form
//= require app
//= require modules/log
//= require modules/config
//= require modules/bus
//= require modules/map
//= require modules/work
//= require modules/panel
//= require modules/start_banner
//= require modules/ws
//= require modules/header
//= require modules/cartodb
//= require modules/error
//= require views/layer
//= require views/layer_editor
//= require views/map
//= require views/panel
//= require views/polygon
//= require views/polygon_draw_tool
//= require views/polygon_draw_edit_tool
//= require views/projector
//= require views/report
//= require views/result
//= require views/searchbox
//= require views/search_results
//= require views/share_popup
//= require views/tabs
//= require views/upload_box
//= require carbon

function number_format(n) {
  var s = n.toFixed(0);
  var chrs = [];
  var c = 0;
  for(var i = s.length - 1; i != -1; --i, ++c) {
    if(((c % 3) == 0) && c > 0) {
      chrs.push(',');
    }
    chrs.push(s.charAt(i));
  }
  return chrs.reverse().join('');
}

function init() {
  // use timeout trick to avoid jquery catch the exceptions thrown
  setTimeout(function() {
    App(function(app) {
      var carbon = new app.Carbon();
      carbon.run();
      //debug
      window.carbon = carbon;
      window._app= app;
    });
  }, 100);
}

$(document).ready(function() {
  init();
});
