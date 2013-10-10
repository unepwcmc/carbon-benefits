$(function() {
  window.MapLayer = Backbone.View.extend({
    template: _.template('<span class="color <%=normalized_name%>">&nbsp</span><%= name %>'),

    tagName: 'li',

    LEGENDS: {
      'carbon': 'layer_carbon_legend.png',
      'carbon seq. potential': 'layer_carbon_seq_legend.png',
      'restoration potential': 'layer_res_pot_legend.png',
      'forest status': 'layer_forest_status_legend.png',
      'Ecological Gap Analysis': 'gap_analysis_legend.png'
    },

    events: {
      'click': 'toggle'
    },

    initialize: function(map_layer) {
      var self = this;
      this.map_layer = this.options.map_layer;
      this.bus = this.options.bus;
      this.bus.on('map:enable_map_layer', function(name, enabled) {
        if(name === self.map_layer.name) {
          if(enabled) {
            $(self.el).addClass('enabled');
          }
          else {
            $(self.el).removeClass('enabled');
          }
        }
      });
    },

    render: function() {
      var leg;
      var el = $(this.el);
      var d = _.extend(this.map_layer, {
        normalized_name: this.map_layer.name.replace(/ /g, '_').replace(".", "")
      });
      var html = this.template(d);
      if(leg = this.LEGENDS[this.map_layer.name]) {
        html += '<img src="/assets/'+ leg +'" />';
      }
      el.html(html).addClass('sortable').attr('id', this.map_layer.name.replace(".", ""));
      if(this.map_layer.enabled) {
        el.addClass('enabled');
      }
      return this;
    },

    toggle: function() {
      this.bus.emit('map:enable_map_layer', this.map_layer.name, !this.map_layer.enabled);
    }
  });
});
