window.UploadBox = Backbone.View.extend({
  el: $("#upload_box"),

  events: {
    'click #close_upload_box': 'close',
  },

  initialize: function() {
    _.bindAll(this, 'open', 'close');
  },

  close: function(e) {
    if(e) e.preventDefault();
    $('#upload_box').hide();
  },

  open: function() {
    $('#upload_box').show();
  }
});
