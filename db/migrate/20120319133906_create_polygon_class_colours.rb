class CreatePolygonClassColours < ActiveRecord::Migration
  def change
    create_table :polygon_class_colours do |t|
      t.integer :polygon_class_id
      t.integer :layer_id
      t.string :colour

      t.timestamps
    end
  end
end
