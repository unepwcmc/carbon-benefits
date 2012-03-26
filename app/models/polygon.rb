class Polygon
  include ActiveRecord::AttributeAssignment

  #TABLENAME = :polygon
  TABLENAME = :polygon_test

  #Model to access cartodb's polygons
  ATTRIBUTES = [ :cartodb_id, :name, :the_geom, :class_id, :layer_id, :class_name]
  ATTRIBUTES.each do |attr| attr_accessor attr end

  def initialize attributes = nil
    assign_attributes(attributes.delete_if{|k,v| !ATTRIBUTES.include?(k.to_sym)}, :without_protection => true) if attributes
  end

  #Inserts a polygon into CartoDB
  def save
    if cartodb_id
      update
    else
      #puts self.the_geom
      #response = CartoDB::Connection.insert_row(TABLENAME, attributes.delete_if{|k,v| k == :cartodb_id})
      self.the_geom = Polygon.gmaps_path_to_wkt(self.the_geom)
      sql = <<-SQL
        INSERT INTO #{TABLENAME} (the_geom, name, class_id, layer_id) VALUES (#{self.the_geom||"NULL"}, '#{self.name}', #{self.class_id||"NULL"}, #{self.layer_id||"NULL"});
        SELECT cartodb_id , ST_Transform(the_geom, 900913) as the_geom FROM #{TABLENAME} WHERE cartodb_id = currval('public.#{TABLENAME}_cartodb_id_seq');
      SQL

      response = CartoDB::Connection.query(sql)
      row = response[:rows].first
      self.cartodb_id = row[:cartodb_id]
      self.the_geom = RGeo::GeoJSON.encode(row[:the_geom]) if row[:the_geom]
    end
    self
  end

  #Updates a record in CartoDB
  def update
    #CartoDB::Connection.update_row(TABLENAME, cartodb_id, attributes.delete_if{|k,v| k == :cartodb_id})
    
    self.the_geom = Polygon.gmaps_path_to_wkt(self.the_geom) if self.the_geom
    sql = <<-SQL
        UPDATE #{TABLENAME}
          SET
            the_geom=#{self.the_geom||"NULL"},
            name='#{self.name}',
            class_id=#{self.class_id||"NULL"},
            layer_id=#{self.layer_id||"NULL"}
          WHERE cartodb_id = #{self.cartodb_id};
        SELECT cartodb_id , ST_Transform(the_geom, 900913) as the_geom FROM #{TABLENAME} WHERE cartodb_id = #{self.cartodb_id};
    SQL

    response = CartoDB::Connection.query(sql)
    row = response[:rows].first
    self.the_geom = RGeo::GeoJSON.encode(row[:the_geom]) if row[:the_geom]
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
      coordinates << "#{coordinate[0]} #{coordinate[1]}"
    end
    coordinates << "#{path[0][0]} #{path[0][1]}" # Close the polygon

    "ST_Transform(ST_GeomFromText('MULTIPOLYGON(((#{coordinates.join(',')})))', 900913),4326)"
  end

  # Translates a geojson object to a gmaps path
  #
  # @params [Hash] geojson the geojson to convert to gmaps
  # @return [Array] an array of the points 
  def self.geojson_to_gmaps_path geojson
    path = geojson['coordinates'].flatten 2
    path.delete_at(path.length-1)
    path
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

  def self.create_or_update_from attributes, layer_id
    if attributes[:cartodb_id].nil?
      polygon = self.new(attributes)
      polygon.layer_id = layer_id
      polygon.save
    else
      polygon = self.find(attributes[:cartodb_id])
      if polygon && polygon.layer_id == layer_id
        polygon.name = attributes[:name]
        polygon.the_geom = attributes[:the_geom]
        polygon.class_id = attributes[:class_id]
        polygon.update
      end
    end
  end
end
