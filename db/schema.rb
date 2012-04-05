# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120402151021) do

  create_table "errors", :force => true do |t|
    t.text     "error",      :default => ""
    t.datetime "when"
    t.datetime "created_at",                 :null => false
    t.datetime "updated_at",                 :null => false
  end

  create_table "layers", :force => true do |t|
    t.integer  "work_id"
    t.string   "name"
    t.text     "stats"
    t.datetime "created_at",                                      :null => false
    t.datetime "updated_at",                                      :null => false
    t.string   "user_layer_file_file_name"
    t.string   "user_layer_file_content_type"
    t.integer  "user_layer_file_file_size"
    t.datetime "user_layer_file_updated_at"
    t.text     "meta_data"
    t.boolean  "is_uploaded",                  :default => false
    t.integer  "selected_polygon_class_id"
    t.text     "selected_polygon_ids"
  end

  create_table "polygon_class_colours", :force => true do |t|
    t.integer  "polygon_class_id"
    t.integer  "layer_id"
    t.string   "colour"
    t.datetime "created_at",       :null => false
    t.datetime "updated_at",       :null => false
  end

  create_table "polygon_classes", :force => true do |t|
    t.string   "name"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "polygons", :force => true do |t|
    t.integer  "layer_id"
    t.integer  "polygon_class_id"
    t.string   "name"
    t.text     "string_path"
    t.datetime "created_at",       :null => false
    t.datetime "updated_at",       :null => false
  end

  create_table "works", :force => true do |t|
    t.text     "json",       :default => "[]"
    t.datetime "created_at",                   :null => false
    t.datetime "updated_at",                   :null => false
    t.text     "summary"
  end

end
