class AddSelectedPolygonIdsToLayer < ActiveRecord::Migration
  def change
    add_column :layers, :selected_polygon_ids, :text
  end
end
