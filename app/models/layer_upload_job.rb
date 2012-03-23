class LayerUploadJob
  include Resque::Plugins::Status

  def perform
    @layer = Layer.find(options['layer_id'])
    @layer_file = @layer.user_layer_file
    @class_field = options['class_field'].downcase
    @name_field = options['name_field'].downcase
    create_in_carto_db

    unless validate
      rollback
      raise "Invalid input file"
    end

    begin
      insert_into_polygons
    rescue
      rollback
      raise "Import failed"
    end
    drop_in_carto_db
  end

private

  def rollback
    puts 'ROLLBACK'
    drop_in_carto_db if @table_name
    @layer.user_layer_file = nil
    @layer.save
  end

  def create_in_carto_db
    res = CartoDB::Connection.create_table '', @layer_file.to_file
    @table_name = res[:name]
  end

  def drop_in_carto_db
    CartoDB::Connection.drop_table @table_name
  end

  def validate
    res = CartoDB::Connection.query "SELECT GeometryType(the_geom) AS geom_type FROM #{@table_name} LIMIT 1"
    first_row = res.rows.first
    @geom_type = first_row && first_row[:geom_type]
    if @geom_type == 'MULTIPOLYGON'
      # http://postgis.17.n6.nabble.com/Convert-multipolygons-to-separate-polygons-td3555935.html
      res = CartoDB::Connection.query "SELECT GeometryType((ST_Dump(the_geom)).geom) AS geom_type FROM #{@table_name} GROUP BY geom_type"
      res.rows.each do |row|
        return false if row[:geom_type] != 'POLYGON'
      end
    elsif @geom_type == 'POLYGON'
    end
    true
  end

  def insert_into_polygons
    #insert into polygons
    sql = if @geom_type == 'POINT'
      #need to buffer points
      "INSERT INTO #{Polygon::TABLENAME} (layer_id, class_name, name, the_geom) " +
      "SELECT #{@layer.id} AS layer_id, '#{@class_field}', '#{@name_field}', ST_Multi(ST_Buffer(the_geom, 0.1)) FROM #{@table_name};"
    else
      #need to dump multi polygons into polygons
      "INSERT INTO #{Polygon::TABLENAME} (layer_id, class_name, name, the_geom) " +
      "SELECT #{@layer.id} AS layer_id, '#{@class_field}', '#{@name_field}', ST_Multi((ST_Dump(the_geom)).geom) FROM #{@table_name};"
    end

    res = CartoDB::Connection.query(sql)

    #get the missing classes
    class_names_to_add = CartoDB::Connection.query(
      "SELECT DISTINCT \"#{@class_field}\" FROM #{@table_name}"
    ).rows.map{ |c| c[:"#{@class_field}"] }
    class_names_to_add.each do |c|
      PolygonClass.find_or_create_by_name(c)
    end

    #fetch the updated classes dictionary
    polygon_classes = PolygonClass.select('id, name').all
    #create a lookup hash with class names / ids mapping
    polygon_classes_mapping = Hash[*polygon_classes.map do |c|
        [c.name, c.id]
    end.flatten]

    polygon_classes_mapping.keys.each do |k|
      CartoDB::Connection.query(
        ActiveRecord::Base.send(
          :sanitize_sql_array,
          [
            "UPDATE #{Polygon::TABLENAME} SET class_id = ? WHERE class_name = ?",
            polygon_classes_mapping[k],
            k
          ]
        )
      )
    end
  end

end