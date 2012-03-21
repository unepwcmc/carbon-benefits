class CreateLayers < ActiveRecord::Migration
  def change
    create_table :layers do |t|
      t.integer :work_id
      t.string :name
      t.text :stats
      t.text :polygons

      t.timestamps
    end
  end
end
