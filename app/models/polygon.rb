class Polygon
  include ActiveRecord::AttributeAssignment

  #TABLENAME = :polygon
  TABLENAME = :polygon_test_copy

  #Model to access cartodb's polygons
  ATTRIBUTES = [ :cartodb_id, :name, :the_geom, :class_id, :layer_id, :class_name]
  ATTRIBUTES.each do |attr| attr_accessor attr end

  def initialize attributes = nil
    #assign_attributes(attributes.delete_if{|k,v| !ATTRIBUTES.include?(k.to_sym)}, :without_protection => true) if attributes
    ATTRIBUTES.each do |attr|
      send(attr.to_s+'=', attributes[attr]||attributes[attr.to_s])
    end
  end

  #Inserts a polygon into CartoDB
  def save
    if cartodb_id
      update
    else
      self.the_geom = Polygon.gmaps_path_to_wkt(self.the_geom)
      result = CartoDB::Connection.insert_row(TABLENAME, attributes.delete_if{|k,v| k == :cartodb_id})
      self.cartodb_id = result[:cartodb_id]
      self.the_geom = RGeo::GeoJSON.encode(result[:the_geom]) if result[:the_geom]
    end
    self
  end

  #Updates a record in CartoDB
  def update
    self.the_geom = Polygon.gmaps_path_to_wkt(self.the_geom) if self.the_geom
    result = CartoDB::Connection.update_row(TABLENAME, cartodb_id, attributes.delete_if{|k,v| k == :cartodb_id})

    self.the_geom = RGeo::GeoJSON.encode(result[:the_geom]) if result[:the_geom]
    self
  end

  def attributes
    Hash[ATTRIBUTES.map{ |attr|
      [attr,send(attr)]
    }]
  end

  # Build a new object using the params from backbone
  #
  # @param [Hash] params posted from backbone, slightly denormalised attributes
  # @return [Polygon] the newly built polygon
  def self.new_from_params params
    class_name = params.delete(:class)
    params[:class_id] = PolygonClass.find_or_create_by_name(class_name).id

    Polygon.new(params)
  end

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
  def to_json
    json = super
    json = JSON.parse(json)
    json['the_geom'] = the_geom ? Polygon.geojson_to_gmaps_path(the_geom) : []
    json.to_json
  end

  def self.find cartodb_id
    new(CartoDB::Connection.row(TABLENAME, cartodb_id))
  end

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
end
