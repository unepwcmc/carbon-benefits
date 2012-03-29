class AddSelectedPolygonClassIdToLayers < ActiveRecord::Migration
  def change
    add_column :layers, :selected_polygon_class_id, :integer
  end
end
