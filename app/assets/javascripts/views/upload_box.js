window.UploadBox = Backbone.View.extend({
  el: '#upload_box',

  events: {
    'click .close': 'close',
    'click .submit': 'submit'
  },

  initialize: function() {
    _.bindAll(this, 'open');
    this.form_el = this.$('form');
    //this.form_el.target = 'upload_target';
    this.layer_id = this.options['layer_id'];

    var status = $('#status'); 

    $(this.form_el).ajaxForm({
      beforeSend: function() {
        status.empty();
      },
      complete: function(xhr) {
        status.html('Upload complete');
        var response = xhr.responseText;
      }
    });
  },

  close: function(e) {
    if(e) e.preventDefault();
    $(this.el).hide();
  },

  open: function() {
    this.resetValidationErrors();
    $(this.form_el).find('input[type="hidden"]').val(this.layer_id);
    $(this.el).show();
  },

  submit: function() {
    this.resetValidationErrors();
    if(this.validateForm()){
      this.form_el.submit();
    } else {
      return false;
    }
  },

  validateForm: function(){
    var validationMessages = [];
    var fileInput = $(this.form_el).find('input:file');
    if (fileInput.val() === ''){
      fileInput.parent().prepend('<p class="validation_error">Please select a file for upload.</p>');
      return false;
    }
    return true;
  },

  resetValidationErrors: function(){
    $('.validation_error').remove();
  }

});
