class Polygon
  include ActiveRecord::AttributeAssignment

  TABLENAME = :polygon

  #Model to access cartodb's polygons
  attr_accessor :cartodb_id, :name, :the_geom, :class_id, :layer_id

  def initialize attributes = nil
    assign_attributes(attributes, :without_protection => true) if attributes
  end
  
  def self.find cartodb_id
    new(CartoDB::Connection.row(TABLENAME, cartodb_id))
  end
end
