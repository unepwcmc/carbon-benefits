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
    var that = this;
    $(this.el).css('height', 'auto');
    $(this.el).append(this.template({fields: this.fields, layer_id: this.layer_id}));

    // ajaxify the newly created form
    this.form_el = this.$('form');
    $(this.form_el).ajaxForm({
      dataType: 'json',
      beforeSend: function(){
        $(that.el).hide();
        that.uploadingView = new UploadingView({layerId: that.layer_id, work: carbon.work.work});
      },
      success: function(res_json){
        that.uploadingView.pollForUploadProgress(res_json['job_id']);
      },
      error: function(xhr){
        that.uploadingView.upload_finished({status: 'error', message: 'Upload failed'});
      }
    });
  },

});
