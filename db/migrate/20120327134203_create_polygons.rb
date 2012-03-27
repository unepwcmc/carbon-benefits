class CreatePolygons < ActiveRecord::Migration
  def change
    create_table :polygons do |t|
      t.integer :layer_id
      t.integer :polygon_class_id
      t.string :name
      #t.text :the_geom
      t.text :string_path

      t.timestamps
    end
  end
end
