$(function() {
  window.Panel = Backbone.View.extend({
    el : $('#panel'),

    events: {
        'click #add_report': 'create_report'
    },

    initialize: function() {
      _.bindAll(this, 'add_report', 'create_report');
      var self = this;
      this.bus = this.options.bus;
      this.reports = [];
      this.reports_map = {};
      this.tabs = new Tabs({el: this.$('#tabs')});
      this.tabs.bind('enable', function() {});
      this.tab_contents = this.$('#tab_content');
      this.bus.on('loading_started', function() {
        _(self.reports).each(function(r) {
          r.loading(true);
        });
      });
      this.bus.on('loading_finished', function() {
        _(self.reports).each(function(r) {
          r.loading(false);
        });
      });
    },

    create_report: function(e) {
      e.preventDefault();
      this.trigger("add_report");
    },

    add_report: function(cid, data) {
      var r = new Report({
        bus: this.bus,
        rid: cid
      });
      this.reports.push(r);
      this.reports_map[cid] = r;
      this.tab_contents.append(r.render(data).el);
      this.tabs.add_report(cid, data);
    },

    remove_all: function() {
      this.tabs.clear();
      this.tab_contents.html('');
      for(var i = 0; i < this.reports.length; ++i) {
        delete this.reports[i];
      }
      this.reports_map = {};
      this.reports = [];
    },

    update_report: function(cid, data) {
      this.reports_map[cid].render(data);
      this.tabs.update(cid, data);
    },

    show_report: function(cid) {
      //hide all first
      _(this.reports).each(function(r) {
        if(r.rid != cid) {
          r.hide();
        }
      });
      this.reports_map[cid].show();
      this.tabs.show_tab(cid);
    },

    hide: function() {
      this.el.hide();
    },

    show: function() {
      this.el.show();
    }
  });
});
