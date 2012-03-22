class Polygon
  include ActiveRecord::AttributeAssignment

  #TABLENAME = :polygon
  TABLENAME = :polygon_test

  #Model to access cartodb's polygons
  ATTRIBUTES = [ :cartodb_id, :name, :the_geom, :class_id, :layer_id ]
  ATTRIBUTES.each do |attr| attr_accessor attr end

  def initialize attributes = nil
    assign_attributes(attributes, :without_protection => true) if attributes
  end

  #Inserts a polygon into CartoDB
  def save
    response = CartoDB::Connection.insert_row(TABLENAME, attributes.delete_if{|k,v| k == :cartodb_id})
    self.cartodb_id = response[:cartodb_id]
    self
  end

  #Updates a record in CartoDB
  def update
    CartoDB::Connection.update_row(TABLENAME, cartodb_id, attributes.delete_if{|k,v| k == :cartodb_id})
  end

  def attributes
    Hash[ATTRIBUTES.map{ |attr|
      [attr,send(attr)]
    }]
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
      if polygon && polygon.layer_id == self.id
        polygon.name = attributes[:name]
        polygon.the_geom = attributes[:the_geom]
        polygon.class_id = attributes[:class_id]
        polygon.update
      end
    end
  end
end
