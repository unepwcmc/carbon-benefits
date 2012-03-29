class RemovePolygonsFromLayers < ActiveRecord::Migration
  def up
    remove_column :layers, :polygons
      end

  def down
    add_column :layers, :polygons, :text
  end
end
