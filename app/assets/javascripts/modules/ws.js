/*
 ===============================================
 external ws
 ===============================================
*/
App.modules.WS = function(app) {

    var WS = app.WS = {};

    WS.ProtectedPlanet = {
        URL: 'http://protectedplanet.net/',
        /**
         * call callbacl with the info a [lat, lon]
         * is called with null if thereis no info
         */
        info_at: function(latLng, callback) {
            $.getJSON(this.URL + 'api/sites_by_point/' + latLng[1] + '/' + latLng[0] + '?callback=?')
            .success(function(data) {
                if(data && data.length) {
                    callback(data[0]);
                } else {
                    callback(null);
                }
             })
            .error(function() { callback(null); });
        },

        PA_polygon: function(pa_id, callback) {
            $.getJSON(this.URL + 'api2/sites/' + pa_id + '/geom' + '?callback=?')
            .success(function(data) {
                if(data) {
                    callback(data);
                } else {
                    callback(null);
                }
             })
            .error(function() { callback(null); });
        },

        PA_coverage: function(polygon, callback) {
          $.ajax({
            url: '/api/v0/proxy/' + this.URL + 'api2/geo_searches',
            type: 'POST',
            data: {data: JSON.stringify([{id: 1, the_geom: polygon}])},
            success: callback,
            error: function(){ callback(null); }
          });
        },

        test: function() {
          var p = [[[-1.4170918294416264,23.148193359375],[-1.6806671337507222,25.125732421875],[-3.743671274749718,24.290771484375]]];
          this.PA_coverage(app.CartoDB.wtk_polygon(p), function(d) {
          });
        }
    };


    /*
     ====================================================
     cartodb service
     ====================================================
    */

    WS.CartoDB = {
        calculate_stats: function(polygons, callback) {
            var stat;
            var stats = {};
            var stats_to_get = ['carbon',
                    'covered_by_PA',
                    'carbon_sequestration',
                    'restoration_potential',
                    'forest_status',
                    'covered_by_KBA'
                    ];

            function ready(what) {
                if(what == 'carbon') {
                    app.CartoDB.conservation_priorities(polygons, stats.carbon.area, function(data) {
                        stats['conservation_priorities'] = data;
                        callback(stats);
                    });
                }
            }

            function get_stat(stat) {
                app.bus.emit("loading_start");
                app.Log.log("init ", stat);
                app.CartoDB[stat](polygons, function(data) {
                    app.Log.log("end ", stat);
                    app.bus.emit("loading_end");
                    if(data) {
                        stats[stat] = data;
                        ready(stat);
                        callback(stats);
                    } else {
                        app.Log.error("can't get stats from cartodb for ", stat);
                        ready(stat);
                    }
                });
             }

             while(stat = stats_to_get.pop()) {
               get_stat(stat); 
             }
        },

        aggregate_stats: function(layers, polygons, callback) {
            function sum(layers, what) {
                var t = 0;
                _(layers).each(function(r) {
                    t += what(r);
                });
                return t;
            }
            // carbon
            var total_carbon = sum(layers, function(r) {
                var s = r.get('stats');
                if(s && s.carbon && s.carbon.qty) {
                    return s.carbon.qty;
                }
                return 0;
            });

            var total_area = sum(layers, function(r) {
                var s = r.get('stats');
                if(s && s.carbon && s.carbon.area) {
                    return s.carbon.area;
                }
                return 0;
            });

            var carbon_per_polygon = _(layers).map(function(r, i) {
                var percent = 0;
                var percent_seq = 0;
                var s = r.get('stats');
                if(total_carbon > 0 && s && s.carbon && s.carbon.qty && s.carbon_sequestration && s.carbon_sequestration.qty) {
                    percent =  s.carbon.qty/total_carbon;
                    percent_seq =  percent*s.carbon_sequestration.qty/s.carbon.qty;
                }
                return {
                    polygon: 'AOI #' + (i + 1),
                    percent: 100*percent,
                    percent_seq: 100*percent_seq,
                    carbon: s.carbon ? s.carbon.qty: 0,
                    carbon_sequestration: s.carbon_sequestration? s.carbon_sequestration.qty:0

                };
            });

            var covered_by_kba = sum(layers, function(r) {
                var s = r.get('stats');
                if(total_area && s && s.carbon && s.carbon.area && s.covered_by_KBA) {
                    return s.covered_by_KBA.percent*s.carbon.area/total_area;
                }
                return 0;
            });

            var covered_by_pa = sum(layers, function(r) {
                var s = r.get('stats');
                if(total_area && s && s.covered_by_PA) {
                    return 1e6*s.covered_by_PA.km2/total_area;
                }
                return 0;
            });

            var total_stats = {
                carbon_sum: {
                    qty: total_carbon,
                    polygons: carbon_per_polygon,
                    area: total_area
                },
                coverage: {
                    PA: covered_by_pa*100,
                    KBA: covered_by_kba
                }
            };

            // get conservation priorities
            app.CartoDB.conservation_priorities(polygons, total_area, function(data) {
                if(data) {
                    total_stats.conservation_priority_areas = data;
                }
                /* callback(total_stats); */
                /* TODO FIXME the callback was not executed for uploaded layers */
            });
            callback(total_stats);
        }
    };
}
