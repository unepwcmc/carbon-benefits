$(function() {
  window.Report = Backbone.View.extend({
      tagName:  "div",

      template: JST["templates/report"],
      template_no_content: JST["templates/report_common_no_template"],
      template_header: JST["templates/report_common"],

      events: {
          'click .non_editing .go_edit': 'go_edit',
          'click .non_editing .remove': 'go_remove',
          'click .editing .leave_edit': 'leave_edit',
          'click .removing .cancel': 'leave_edit',
          'click .removing .remove_it_please': 'remove_polygons',
          'click .start_drawing': 'go_edit',
          'click .start_uploading': 'go_upload',
          'mouseover .tooltip li': 'show_tooltip',
          'mouseleave .tooltip li': 'hide_tooltip',

          'mouseover .title h2': 'show_tooltip_help',
          'mouseleave .title h2': 'hide_tooltip_help',
          'click .select_classes': 'toggle_classes_list'
      },

      initialize: function() {
          _.bindAll(this, 'show', 'hide', 'render', '_render_stats');
          $(this.el).addClass('tab_content_item');
          this.bus = this.options.bus;
          this.rid = this.options.rid;
          this.header = null;
          this.showing_loading = false;
          this.showing = false;
          this.render_stats = _.debounce(this._render_stats, 300);
          this.tooltip_timer = undefined;
      },

      _render_stats: function(data) {
          var self = this;
          this.$('.report_stats').remove();
          $(this.el).append(this.template(data));
          var s = this.$('.report_stats');
          s.hide().fadeIn();
          if(data.total) {
            s.css({top: 5});
          }
          if ($.browser.msie  && parseInt($.browser.version, 10) == 7) {
              // jscrollpane does not want to work 
          } else {
              setTimeout(function() {
                  self.$('.report_stats').jScrollPane({autoReinitialise:true});//, autoReinitialiseDelay: 10000}); //, contentWidth: 312});
              }, 0);
          }
      },

      render: function(data) {
          var self = this;
          if(data.polygons.length !== 0 || data.total) {
              // check if header has been already rendered and 
              // update only the stats part
              if(this.header) {
                  this.render_stats(data);
                  this.header.find('.polygon_num').html(data.polygons.length);
              } else {
                  if(!data.total) {
                      $(this.el).html(this.template_header(data));
                  }
                  this.render_stats(data);
                  this.header = this.$('.stats_header');
              }
              this.leave_edit();
          } else {
              $(this.el).html(this.template_no_content(data));
              this.header = null;
              //this.go_edit();
          }
          this.loading(this.showing_loading);
          return this;
      },

      show_tooltip_help: function(e) {
        var el = $(e.currentTarget);
        var what = el.html().replace(/ /g, '_').replace('.','_');
        var tooltip = $('#panel').find('.help_popup.' + what);
        var _top;
        if( $(this.el).find('.jspPane').length > 0 ) {
          _top = $(this.el).find('.jspPane').position().top;
        } else {
          _top = $(this.el).find('.no_content').position().top;
        }
        var pos = el.position();
        var h = tooltip.outerHeight();
        tooltip.css({top: pos.top + _top + 170 - h - 10 , left: 20});
        //set html rendered previousl
        clearTimeout(self.tooltip_timer)
        $('#panel').find('.help_popup').hide();
        self.tooltip_timer = setTimeout(function() {
          tooltip.show();
        }, 300);
      },

      hide_tooltip_help: function(e) {
        clearTimeout(self.tooltip_timer)
        var tooltip = $('#panel').find('.help_popup');
        self.tooltip_timer = setTimeout(function() {
          tooltip.hide();
        },1000);
      },

      show_tooltip: function(e) {
        var el = $(e.currentTarget);
        var tooltip = $('#panel').find('.list_tooltip');
        var pos = el.position();
        tooltip.css({top: pos.top - 80, left: 120});
        //set html rendered previously
        tooltip.html(el.find('.list_tooltip_data').html());
        tooltip.show();
      },

      hide_tooltip: function(e) {
        //var el = $(e.target);
        var tooltip = $('#panel').find('.list_tooltip');
        tooltip.hide();
      },

      toggle_classes_list: function(e) {
        if(e) e.preventDefault();
        $(".classes_list").toggle();
      },

      go_edit: function(e) {
          if(e) e.preventDefault();
          this.$('.non_editing').hide();
          this.$('.removing').hide();
          this.$('.editing').show();
          if(this.showing)
            this.bus.emit('map:edit_mode');
      },

      go_upload: function(e) {
        if(e) e.preventDefault();
        var uB = new UploadBox();
        uB.open();
      },

      leave_edit: function(e) {
          if(e) e.preventDefault();
          this.$('.editing').hide();
          this.$('.removing').hide();
          this.$('.non_editing').show();
          if(this.showing)
            this.bus.emit('map:no_edit_mode');
      },
    
      go_remove: function(e) {
          if(e) e.preventDefault();
          this.$('.editing').hide();
          this.$('.non_editing').hide();
          this.$('.removing').show();
      },

      remove_polygons: function(e) {
        if(e) e.preventDefault();
        this.bus.emit("model:delete_report", this.rid);
      },

      show: function() {
          this.showing = true;
          $(this.el).show();
      },

      hide: function() {
          this.showing = false;
          $(this.el).hide();
      },

      loading: function(b) {
          this.showing_loading = b;
          if(this.header) {
              var loading = this.header.find('.loader');
              var add_poly = this.header.find('.editing_tools');
              if(b) {
                  add_poly.animate({'margin-top': '-44px'}, 500);
              } else {
                  //this.leave_edit();
                  add_poly.animate({'margin-top': '0px'}, 500);
              }
          }
      },

      remove: function() {
          $(this.el).remove();
      }
  });
});
