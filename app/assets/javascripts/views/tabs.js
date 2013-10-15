$(function() {
  window.Tabs = Backbone.View.extend({
      events: {
          'click .tab': 'click_activate',
          'change .user-layer-visibility-toggle': 'toggleUserLayerVisibility'
      },

      initialize: function() {
          self = this;
          this.bus = this.options.bus;
          this.tab_el = this.$("ul");
          this.tab_count = 0;
          this.tabs_frozen = false;
          this.bus.on("freeze_tabs", function(context, freeze, selectors) {
            function slow_unfreeze () {
              self.tabs_frozen = false;
            }
            if (!freeze) {
              window.setTimeout(slow_unfreeze, 800);
            } else {
              self.tabs_frozen = true;
            }
            
          });
      },

      toggleUserLayerVisibility: function(e){
        var layerId = $(e.target).attr('data-layer-id');
        var layerData = carbon.map.map.userLayers[layerId];
        if (layerData.visible){
          carbon.map.map.hideUserLayer(layerId);
        } else {
          carbon.map.map.showUserLayer(layerId);
        }
      },

      add_layer: function(cid, data) {
          var el = null;
          var area = '0';
          if(data && data.stats && data.stats.carbon) {
              area =  (data.stats.carbon.area/1000000).toFixed(0);
          }
          if(data && data.stats && data.stats.carbon_sum) {
              area =  (data.stats.carbon_sum.area/1000000).toFixed(0);
          }
          if(data.total) {
              var li = $("<li class='total'><a class='tab' href='#" + cid + "'>summary</a><span class='stats'><span class='stats_inner'><h5>AOIs SUMMARY</h5><p><span class='area'>"+ area +"</span> km<sup>2</sup> in total</p></span></span></li>");
              this.tab_el.append(li);
              el = li;
          } else {
              var name = '';
              var visibilityToggle = '';
              if (data.is_uploaded){
                  var isVisible = carbon.map.map.userLayers[data.id].visible;
                  visibilityToggle = '<span class="user-layer-visibility-toggle">' +
                  '<input type="checkbox" data-layer-id=' + data.id + ' checked="' + isVisible + '"></span>';
                  if (data.name !== ''){
                      name = $.trim(data.name);
                      if(name.length > 16){ name = name.substring(0,15) + '...'}
                  } else {
                      name = 'uploaded layer';
                  }
              } else {
                  name = "<p><span class='area'>"+ area +"</span> km<sup>2</sup></p>";
              }
              this.tab_count++;
              var li = $("<li><a class='tab' href='#" + cid + "'>#"+this.tab_count+"</a><span class='stats'><span class='stats_inner'>" +
              "<h5>AOI #"+this.tab_count+" " + visibilityToggle + "</h5>" +
              "<p>" + name +"</p></span></span></li>");
              li.insertBefore(this.$('#add_layer').parent());
              el = li;
          }

          // remove add if is needed
          if(this.tab_count == 3) {
              this.tab_el.find('#add_tab').remove();
          }

          if(el) {
              var self = this;
              if ($.browser.msie  && parseInt($.browser.version, 10) == 7) {
                setTimeout(function() {
                  self.set_enabled($(el));
                }, 500);
              } else {
                  self.set_enabled($(el));
              }
          }
      },

      update: function(rid, data) {
          var a = 0;
          if(data.stats.carbon) {
              a = data.stats.carbon.area;
          } else if (data.stats.carbon_sum) {
              a = data.stats.carbon_sum.area;
          }
          a = a || 0;
          this.tab_el.find("a[href=#" + rid +"]").parent().find('.area').html((a/100000).toFixed(0));
      },

      clear: function() {
          this.tab_el.html('');
          this.tab_el.append("<li id='add_tab'><a id='add_layer' href='#add_layer'>+</a></li>");
          this.tab_count = 0;
      },

      click_activate: function(e) {
          e.preventDefault();
          if (this.tabs_frozen) {
            return;
          }
          //this.trigger('enable', $(e.target).attr('href').slice(1));
          //IE7 love
          this.trigger('enable', $(e.target).attr('href').split('#')[1]);
          this.set_enabled($(e.target).parent());
      },

      show_tab: function(rid) {
        var el = this.tab_el.find("a[href$=#" + rid +"]").parent();
        this.set_enabled($(el));
      },

      set_enabled: function(el) {
          this.$('li').removeClass('enabled').removeAttr('style');
          $(el).addClass('enabled');
          if ($(el).hasClass('total')) {
              var li_w = 0;
              this.tab_el.find('li').each(function(i,li){li_w += $(li).width()});
              var width = this.tab_el.width() - li_w + 66;
              $(el).find('span.stats').width(width);
          } else {
              var width = $(el).find('span.stats').width();
              $(el).width(width+38);
          }
      }
  });
});
