$(function() {
  window.UploadingView = Backbone.View.extend({
    tagName:  "div",

    template_upload_feedback: JST["templates/layer_common_upload_feedback"],
    initialize: function() {
      this.layerId = this.options.layerId;
      this.work = this.options.work;
      this.render({message: 'Please wait'});
    },

    render: function(data) {
      $('#tab_content').append($(this.el).html(this.template_upload_feedback(data)));
      this.show();
    },

    pollForUploadProgress: function(jobId){
      var that = this;
      this.timerId = setInterval(function(){
        $.ajax({
          url: "/layers/get_job_status?job_id="+jobId,
          success: function(data){
            if(true){
              that.upload_finished({status: 'success', 'message': 'Upload finished'});
            } else if (data['status'] === 'failed'){
              alert('failed');
              that.upload_finished({status: 'error', 'message': data['message']});
            }
            console.log(data);
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
      if(r) {
          this.render({message: 'Upload in progress...'});
      } else {
          app.Log.error("can't get layer: ", this.layerId);
      }
    },
    upload_finished: function(data){
      if(data['status'] == 'success'){
        this.render({message: 'Upload complete'});
        this.hide();
        this.work.on_layer_change(this.work.get(this.layerId));
      } else {
        alert('failed');
        this.render({message: 'Upload failed: ' + data['message']});
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