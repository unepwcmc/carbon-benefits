window.FieldPicker = Backbone.View.extend({
  el: '#upload_box',

  events: {
  },

  initialize: function() {
    _.bindAll(this, 'render');

    this.layer_id = this.options['layer_id'];
    this.layer_id = this.options['layer_id'];

    this.render();
  },


  render: function() {
    $(this.el).html('insert field picker here');
  }
});
