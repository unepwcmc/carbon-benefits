$(function() {
  window.UploadingView = Backbone.View.extend({
    tagName:  "div",

    events: {
      'click .cancel': 'cancel'
    },

    template_upload_feedback: JST["templates/layer_common_upload_feedback"],
    initialize: function() {
      this.bus = this.options.bus;
      this.layerId = this.options.layerId;
      this.work = this.options.work;
      this.render({message: 'Please wait'});
    },

    render: function(data) {
      $('#tab_content').append($(this.el).html(this.template_upload_feedback(data)));
      this.show();
    },

    cancel: function() {
      var layer = this.work.get(this.layerId);
      this.work.delete_layer(layer.cid);
      // dear lord
      layer.url = "/layers/"+layer.id;
      layer.destroy();

      location.reload(true);
    },

    pollForUploadProgress: function(jobId){
      var that = this;
      this.timerId = setInterval(function(){
        $.ajax({
          url: "/layers/get_job_status?job_id="+jobId,
          success: function(data){
            if(data['status'] === 'completed'){
              that.upload_finished({status: 'success', 'message': 'Upload finished'});
            } else if (data['status'] === 'failed'){
              that.upload_finished({status: 'error', 'message': data['message']});
            }
          },
          error: function(data){
            alert('error');
            that.upload_finished({status: 'error', 'message': 'Upload failed'});
          },
          dataType: "json"
        });
      }, 10000);
    },
    upload_started: function() {
      var r = this.work.get(this.layerId);
      this.bus.emit("freeze_tabs", this, true, '#tabs li:not(.enabled) a');
      if(r) {
          this.render({message: 'Upload in progress...'});
      } else {
          app.Log.error("can't get layer: ", this.layerId);
      }
    },
    upload_finished: function(data){
      this.bus.emit("freeze_tabs", this, false, '#tabs li:not(.enabled) a');
      if(data['status'] == 'success'){
        this.render({message: 'Upload complete'});
        //this.hide();
        //this.work.on_layer_change(this.work.get(this.layerId));

        // Fancy JavaScript panel control? Nope, just reload the page
        location.reload(true);
      } else {
        this.render({message: 'Sorry, there was a problem with your upload: ' + data['message']});
      }
      clearInterval(this.timerId);
    },
    show: function() {
      $('#tab_content .tab_content_item').slideUp();
      $('#tab_content').append(this.el);
      $(this.el).slideDown();
    },
    hide: function() {
      $('#tab_content .tab_content_item').slideDown();
      $(this.el).remove();
    }
  });
}());
