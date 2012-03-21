class AddPolygonsToLayers < ActiveRecord::Migration
  def change
    add_column :layers, :polygons, :text

  end
end
