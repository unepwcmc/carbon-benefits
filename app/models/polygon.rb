class Polygon
  TABLENAME = :polygon
  
  #Model to access cartodb's polygons
  attr_reader :cartodb_id, :name, :the_geom, :class_id, :layer_id

  def self.find cartodb_id
    CartoDB::Connection.row TABLENAME, cartodb_id
  end
end
