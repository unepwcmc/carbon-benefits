class Polygon
  include ActiveRecord::AttributeAssignment

  TABLENAME = :polygon

  #Model to access cartodb's polygons
  ATTRIBUTES = [ :cartodb_id, :name, :the_geom, :class_id, :layer_id ]
  ATTRIBUTES.each do |attr| attr_accessor attr end

  def initialize attributes = nil
    assign_attributes(attributes, :without_protection => true) if attributes
  end

  def self.find cartodb_id
    new(CartoDB::Connection.row(TABLENAME, cartodb_id))
  end

  def save
    CartoDB::Connection.insert_row(TABLENAME, attributes)
  end

  def attributes
    Hash[Polygon::ATTRIBUTES.map{ |attr|
      [attr,send(attr)]
    }]
  end
end
