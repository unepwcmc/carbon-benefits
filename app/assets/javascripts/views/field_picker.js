window.FieldPicker = Backbone.View.extend({
  el: '#upload_box',
  template: JST["templates/fieldPicker"],

  events: {
    'click .select': 'submit'
  },

  initialize: function() {
    _.bindAll(this, 'render', 'submit');

    this.fields = this.options['fields'];
    this.layer_id = this.options['layer_id'];

    this.render();
  },

  submit: function(e) {
    this.form_el.submit();
  },

  render: function() {
    $(this.el).css('height', 'auto');
    $(this.el).append(this.template({fields: this.fields, layer_id: this.layer_id}));

    // ajaxify the newly created form
    this.form_el = this.$('form');
    $(this.form_el).ajaxForm({
      dataType: 'json',
      success: function(res_json){
        alert('success ' + res_json['job_id']);
      },
      error: function(xhr){
        alert('import failed');
      }
    });
  }

});
