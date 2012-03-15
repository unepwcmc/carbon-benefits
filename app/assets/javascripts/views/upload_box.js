window.UploadBox = Backbone.View.extend({
  tagName: 'div',

  template: JST["templates/upload_box"],

  events: {
  },

  initialize: function(){
    _.bindAll(this, 'show');
  },

  show: function() {
    this.show();
  }
});
