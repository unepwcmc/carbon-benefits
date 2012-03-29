class AddPolygonClassColourIdToLayer < ActiveRecord::Migration
  def change
    add_column :layers, :selected_polygon_class_colour_id, :integer
  end
end
