window.UploadBox = Backbone.View.extend({
  el: '#upload_box',

  events: {
    'click .close': 'close'
  },

  initialize: function() {
    _.bindAll(this, 'open');
  },

  close: function(e) {
    if(e) e.preventDefault();
    $(this.el).hide();
  },

  open: function() {
    $(this.el).show();
  }
});
