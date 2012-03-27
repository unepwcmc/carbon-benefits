class Polygon < ActiveRecord::Base

  belongs_to :layer
  belongs_to :polygon_class

  attr_accessor :path

  # Translates a google maps path to WKT, suitable for inserting
  # into postgis
  #
  # @params [String] path the path to translate
  # @return [String] Geojson string
  def self.gmaps_path_to_wkt path
    coordinates = []
    path.each do |coordinate|
      coordinates << "#{coordinate[1]} #{coordinate[0]}"
    end
    coordinates << "#{path[0][1]} #{path[0][0]}" # Close the polygon

    "ST_GeomFromText('MULTIPOLYGON(((#{coordinates.join(',')})))',4326)"
  end

  # Translates a geojson object to a gmaps path
  #
  # @params [Hash] geojson the geojson to convert to gmaps
  # @return [Array] an array of the points 
  def self.geojson_to_gmaps_path geojson
    path = geojson['coordinates'].flatten 2
    path.delete_at(path.length-1)
    path.map do |coordinates|
      coordinates.reverse
    end
  end

  # Overrides to_json to return the geom as gmaps path
  #
  # @return [String] json representation of object, with gmaps path as geom
  #def to_json
  #  json = super
  #  json = JSON.parse(json)
  #  json['the_geom'] = the_geom ? Polygon.geojson_to_gmaps_path(the_geom) : []
  #  json.to_json
  #end

  def self.create_or_update_from attrs, layer_id
    if attrs[:cartodb_id].nil?
      polygon = self.new(attrs)
      polygon.layer_id = layer_id
      polygon.save
    else
      polygon = self.find(attrs[:cartodb_id])
      if polygon && polygon.layer_id == layer_id
        polygon.name = attrs[:name]
        polygon.the_geom = attrs[:the_geom]
        polygon.class_id = attrs[:class_id]
        polygon.update
      end
    end
  end

  def path
    JSON.parse(self.string_path)
  end

  def path=(path)
    write_attribute(:string_path, path.to_s)
  end
end
