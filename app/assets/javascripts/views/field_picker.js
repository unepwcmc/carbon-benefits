window.FieldPicker = Backbone.View.extend({
  el: '#upload_box',
  template: JST["templates/fieldPicker"],

  events: {
  },

  initialize: function() {
    _.bindAll(this, 'render');

    this.fields = this.options['fields'];
    this.layer_id = this.options['layer_id'];

    this.render();
  },

  render: function() {
    console.log(this.fields);
    $(this.el).append(this.template());
  }
});
