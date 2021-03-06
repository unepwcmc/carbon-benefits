
App.modules.Cartodb = function(app) {

var SQL_CARBON= "SELECT SUM((ST_Value(rast, 1, x, y) / 100) * ((ST_Area(ST_Transform(ST_SetSRID(ST_PixelAsPolygon(rast, x, y), 4326), 954009)) / 10000) / 100)) AS total, \
ST_Area(<%= polygon %>::geography) as area \
FROM carbonsequestration CROSS JOIN \
generate_series(1,10) As x CROSS JOIN generate_series(1,10) As y \
WHERE ST_Intersects(rast, <%= polygon %>) \
AND \
ST_Intersects( \
  ST_Translate(ST_SetSRID(ST_Point(ST_UpperLeftX(rast), ST_UpperLeftY(rast)), 4326), ST_ScaleX(rast)*x, ST_ScaleY(rast)*y), \
  <%= polygon %> \
);";

var SQL_CARBON_COUNTRIES = "\
SET statement_timeout TO 100000; \
SELECT country, SUM((ST_Value(rast, 1, x, y) / 100) * ((ST_Area(ST_Transform(ST_SetSRID(ST_PixelAsPolygon(rast, x, y), 4326), 954009)) / 10000) / 100)) AS total, \
ST_Area(<%= polygon %>::geography) as area \
FROM carbonintersection \
CROSS JOIN \
generate_series(1,10) As x CROSS JOIN generate_series(1,10) As y CROSS JOIN countries \
 \
WHERE ST_Intersects(rast, <%= polygon %>) \
AND \
objectid IN ( SELECT objectid FROM countries WHERE ST_Intersects(the_geom, <%= polygon %>) ) \
AND \
ST_Intersects( \
  ST_Translate(ST_SetSRID(ST_Point(ST_UpperLeftX(rast) + (ST_ScaleX(rast)/2), ST_UpperLeftY(rast) + (ST_ScaleY(rast)/2)), 4326), ST_ScaleX(rast)*x, ST_ScaleY(rast)*y), \
  <%= polygon %> \
) \
AND \
ST_Intersects( \
  ST_Translate(ST_SetSRID(ST_Point(ST_UpperLeftX(rast) + (ST_ScaleX(rast)/2), ST_UpperLeftY(rast) + (ST_ScaleY(rast)/2)), 4326), ST_ScaleX(rast)*x, ST_ScaleY(rast)*y), \
  the_geom \
) \
GROUP BY country;";

var SQL_RESTORATION ="  \
SELECT band, AVG(ST_Value(rast, band, x, y)) AS percentage \
FROM restorationpotencial CROSS JOIN \
generate_series(1,10) As x CROSS JOIN generate_series(1,10) As y CROSS JOIN generate_series(1,4) As band \
WHERE ST_Intersects(rast, <%= polygon %>) \
AND \
ST_Intersects( \
  ST_Translate(ST_SetSRID(ST_Point(ST_UpperLeftX(rast), ST_UpperLeftY(rast)), 4326), ST_ScaleX(rast)*x, ST_ScaleY(rast)*y), \
  <%= polygon %> \
) \
GROUP BY band;"


var SQL_FOREST = " \
SELECT band, SUM(ST_Value(rast, band, x, y)) AS total \
FROM forestintactness CROSS JOIN \
generate_series(1,10) As x CROSS JOIN generate_series(1,10) As y CROSS JOIN generate_series(1,4) As band \
WHERE ST_Intersects(rast, <%= polygon %>) \
AND \
ST_Intersects( \
  ST_Translate(ST_SetSRID(ST_Point(ST_UpperLeftX(rast), ST_UpperLeftY(rast)), 4326), ST_ScaleX(rast)*x, ST_ScaleY(rast)*y), \
  <%= polygon %> \
) \
GROUP BY band;"

//var SQL_COVERED_KBA = "SELECT (overlapped_area / ( SELECT ST_Area(<%= polygon %>) LIMIT 1 )) * 100 AS kba_percentage, count FROM ( SELECT COUNT(1), ST_Area( ST_Intersection( ST_Union(the_geom), <%= polygon %>)) AS overlapped_area FROM kba WHERE ST_Intersects( <%= polygon %>, the_geom) ) foo";

var SQL_COVERED_KBA = " \
SELECT (overlapped_area / ( SELECT ST_Area( ST_MakeValid(<%= polygon %>) \
) LIMIT 1 )) * 100 AS kba_percentage, count FROM ( SELECT COUNT(1), ST_Area( ST_Intersection( ST_Union(the_geom), \
ST_MakeValid(<%= polygon %>) \
)) AS overlapped_area FROM kba WHERE ST_Intersects( \
ST_MakeValid(<%= polygon %>) \
, the_geom) ) foo;"


var SQL_COUNTRIES = "\
SELECT priority, country, ST_Area(ST_Intersection( \
 ST_Union(mg.the_geom), \
 <%= polygon %> \
)::geography) AS covered_area \
FROM gaps_merged mg \
WHERE ST_Intersects(mg.the_geom, \
 <%= polygon %> \
) \
GROUP BY priority, country;";


var SQL_UNION_GEOM = " \
(SELECT ST_Union(the_geom) as unioned_geom FROM " + window.CARTODB_TABLE + " WHERE layer_id = <%= layer_id %> <%= sql_class_where_clause %>)"

    var resource_path= 'carbon-tool.cartodb.com/api/v1/sql';
    var resource_url = 'https://' + resource_path;

    function query(sql, callback, proxy) {
        var url = resource_url;
        var crossDomain = true;
        if(proxy) {
            url = 'api/v0/proxy/' + resource_url
            crossDomain = false;
        }
        if(sql.length > 1500) {
            $.ajax({
              url: url,
              crossDomain: crossDomain,
              type: 'POST',
              dataType: 'json',
              data: 'q=' + encodeURIComponent(sql),
              success: callback,
              error: function(){ 
                if(proxy) {
                    callback(); 
                } else {
                    //try fallback
                    app.Log.log("failed cross POST, using proxy");
                    query(sql, callback, true)
                }
              }
            });
        } else {
             //OK, if the server returns 400 none of the callbacks are called
             // :(
             $.getJSON(resource_url + '?q=' + encodeURIComponent(sql) + '&callback=?')
             .success(callback)
             .fail(function(){ 
                    callback(); 
             }).complete(function() {
             });
        }
    }

    function wtk_polygon(poly) {
        return "ST_GeomFromText('" + wkt_polygon(poly) + "',4326)";
        //return wkt_polygon_(poly);
    }

    function wkt_polygon(poly) {
        var multipoly = [];
        _.each(poly, function(p) {
            p = p.get('path');
            var closed = p.concat([p[0]]);
            var wtk = _.map(closed, function(point) {
                return point[1] + " " + point[0];
            }).join(',');
            multipoly.push("((" + wtk + "))");
        });
        return "MULTIPOLYGON(" + multipoly.join(',') + ")";
    }

    // Alternative for overlapping polygons.
    // FIXME: this needs fixing, before possible use.
    function wkt_polygon_(poly) {
        var polies = [];
        _.each(poly, function(p) {
            p = p.get('path');
            var closed = p.concat([p[0]]);
            var wtk = _.map(closed, function(point) {
                return point[1] + " " + point[0];
            }).join(',');
            polies.push("ST_GeomFromText('POLYGON((" + wtk + "))',4326)");
        });
        return "ST_Union(" + polies.join(',') + ")";
    }

    app.CartoDB = {};
    app.CartoDB.wtk_polygon = wtk_polygon;
    app.CartoDB.test = function() {
        var p = [[[-1.4170918294416264,23.148193359375],[-1.6806671337507222,25.125732421875],[-3.743671274749718,24.290771484375]]];
        /*app.CartoDB.carbon(p, function(data) {
            console.log("carbon", data);
        });
        app.CartoDB.carbon(p, function(data) {
            console.log('countries', data);
        });*/
        app.CartoDB.restoration_potential(p, function(data) {
        });
        /*
        app.CartoDB.forest_status(p, function(data) {
            console.log("forest", data);
        });
        var p2 =[[[-1.5,-77.7],[-1.5,-65.9],[3.1,-65.9],[3.1,-77.7],[-1.5,-77.7],[-1.5,-77.7]]];
        app.CartoDB.conservation_priorities(p2, 10000,  function(data) {
            console.log("conservation priorities", data);
        });
        */

    };

    function stats_query(sql_query, polygon, callback) {
        var c = _.template(sql_query);
        var sql = '';
        // This is evil, but we test if this is an upload is a special object :-S
        if (polygon.length === 1 && polygon[0]['upload'] === true) {
          // Build a query to get the layer geom
          var union_sql_template = _.template(SQL_UNION_GEOM);
          sql = c({
            polygon: union_sql_template({
              layer_id: polygon[0]['layer_id'],
              sql_class_where_clause: polygon[0]['sql_class_where_clause']
            })
          });
        } else {
          // Translate gmaps paths into polygon
          var poly = wtk_polygon(polygon);
          sql = c({polygon: poly});
        }
        query(sql, function(data) {
            if(!data) {
                app.Log.to_server("FAIL SQL(" + location.url + "): " + sql);
            }
            callback(data);
        });
        return sql;
    }

    app.CartoDB.carbon_sequestration = function(p, callback) {
        stats_query(SQL_CARBON, p, function(data) {
            if(data) {
                row = data.rows[0];
                callback({
                    qty: row.total || 0,
                    area: row.area
                });
            } else {
                callback();
            }
        });
    };

    app.CartoDB.carbon = function(p, callback) {
        var sql = stats_query(SQL_CARBON_COUNTRIES, p, function(data) {
            if(data) {
                //{"country":"Ghana","total":12578440024}
                var total = 0;
                var countries = _(data.rows).map(function(c) {
                    total += c.total || 0;
                    return { name: c.country, qty: c.total || 0 };
                });
                callback({
                    qty: total,
                    area: data.rows[0]?data.rows[0].area: 0,
                    countries: countries
                });
            } else {
                callback();
            }
        });
    };

    app.CartoDB.restoration_potential = function(p, callback) {
        stats_query(SQL_RESTORATION, p, function(data) {
            if(data) {
                var value_map = {'1': 'wide_scale', '2': 'mosaic', '3': 'remote', '4':'agricultural lands'};
                var stats = {
                  'wide_scale': 0,
                  'mosaic': 0,
                  'remote': 0,
                  'none': 0
                };
                var total = 1.0;
                var percent = 100.0;
                _.each(data.rows, function(x) {
                    var p = x.percentage;
                    percent -= p;
                    stats[value_map[x.band]] = p;
                });
                stats.none = percent;
                callback(stats);
            } else {
                callback();
            }
        });
    };

    app.CartoDB.covered_by_KBA = function(p, callback) {
        stats_query(SQL_COVERED_KBA, p, function(data) {
            if(data) {
                callback({
                    'percent': Math.min(100, data.rows[0].kba_percentage || 0),
                    'num_overlap': data.rows[0].count|| 0
                });
            } else {
                callback();
            }
        });
    }

    app.CartoDB.forest_status = function(p, callback) {
        stats_query(SQL_FOREST, p, function(data) {
            if(data) {
                var stats = {
                    'intact': 0,
                    'fragmented': 0,
                    'partial': 0,
                    'deforested': 0
                };

                function get_type(v) {
                    if      (3 == v) return 'intact';
                    else if (1 == v) return 'deforested';
                    else if (4 == v) return 'partial';
                    return 'fragmented';
                }
                //Band 1 = Defined as deforested areas
                //Band 2 = Defined as fragmented/managed forest
                //Band 3 = Defined as intact forest
                //Band 4 = Defined as partially deforested areas

                var total = 0;
                _.each(data.rows, function(x) {
                  total += x.total;
                });
                if(total > 0) {
                  _.each(data.rows, function(x) {
                      var k = get_type(x.band);
                      stats[k] = 100.0*x.total/total;
                  });
                }

                callback(stats);
            } else {
                callback();
            }
        });
    }

    app.CartoDB.covered_by_PA = function(p, callback) {
        // This is evil, but we test if this is an upload is a special object :-S
        if (p.length === 1 && p[0]['upload'] === true) {
          sql_query = "SELECT ST_AsText(ST_Union(the_geom)) AS geom FROM " + window.CARTODB_TABLE + " WHERE layer_id=<%= layer_id %> <%= sql_class_where_clause %>";
          var query_template = _.template(sql_query);
          sql = query_template({
              layer_id: p[0]['layer_id'],
              sql_class_where_clause: p[0]['sql_class_where_clause']
          });
          query(sql, function(data) {
            if(!data) {
                app.Log.to_server("FAIL SQL(" + location.url + "): " + sql);
            }
            app.CartoDB._covered_by_PA(data.rows[0].geom, callback);
          });
          return false;
        } else {
          app.CartoDB._covered_by_PA(wkt_polygon(p), callback);
        }
    };

    app.CartoDB._covered_by_PA = function(p, callback){
        // data from protected planet
        // but here to follow the same rule
        // params p is WKT Multipolygon to analyse on
        app.WS.ProtectedPlanet.PA_coverage(p, function(d) {
          if(d && d.sum_pa_cover_km2) {
            var num = 0;
            if(d.results && d.results.length >= 1) {
                num = d.results[0].protected_areas.length;
            }
            callback({
              num_overlap: num,
              km2: d.sum_pa_cover_km2 || 0
            });
          } else {
            callback();
          }
        });
    }

    app.CartoDB.conservation_priorities = function(p, total_area, callback) {
        stats_query(SQL_COUNTRIES, p, function(data) {
            var countries = {};
            var priorities = {
                "Extremamente Alta": 0,
                "extrema": 0,
                "Very High": 0,
                "Muito Alta": 1,
                "High": 1,
                "alta": 1,
                "Alta": 2, // this is ok despite of the translation
                "media": 2,
                "Medium": 2
                //"HUECO": 1
            };
            if(data) {
                _.each(data.rows, function(r) {
                    var priority = priorities[r.priority];
                    if(priority !== undefined) {
                        countries[r.country] = countries[r.country] || new Array(0,0,0,0,0);
                        if(total_area) {
                            countries[r.country][priority] = 100*r.covered_area/total_area;
                        } else {
                            countries[r.country][priority] = 0;
                        }
                    }
                });
                var stats = [];
                _.each(countries, function(percents, country) {
                    var total = percents[0] + percents[1] + percents[2] + percents[3];
                    percents[4] = Math.max(0, 100 - total);
                    stats.push({ name: country, percents: percents});
                });
                callback(stats);
            } else {
                callback();
            }
        });
    };

};
