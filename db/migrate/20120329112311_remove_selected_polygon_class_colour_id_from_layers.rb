class RemoveSelectedPolygonClassColourIdFromLayers < ActiveRecord::Migration
  def up
    remove_column :layers, :selected_polygon_class_colour_id
      end

  def down
    add_column :layers, :selected_polygon_class_colour_id, :integer
  end
end
