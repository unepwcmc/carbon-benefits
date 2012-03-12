class CreateErrors < ActiveRecord::Migration
  def change
    create_table :errors do |t|
      t.text :error, :default => ''
      t.datetime :when

      t.timestamps
    end
  end
end
