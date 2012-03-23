class LayerUploadJob
  include Resque::Plugins::Status

  def perform
    @layer = Layer.find(options['layer_id'])
    @layer_file = @layer.user_layer_file
    @class_field = options['class_field']
    @name_field = options['name_field']
    create_in_carto_db

    unless validate
      rollback
      raise "Invalid input file"
    end

    #begin
      insert_into_polygons
    #rescue
      #rollback TODO
      #delete file
      #drop table
      #raise some_exception_for_resque
    #end
    drop_in_carto_db
  end

private

  def rollback
    #drop_in_carto_db if @table_name
  end

  def create_in_carto_db
    puts "creating new table"
    res = CartoDB::Connection.create_table '', @layer_file.to_file
    puts res.inspect
    @table_name = res[:name]
  end

  def drop_in_carto_db
    puts "dropping the table"
    CartoDB::Connection.drop_table @table_name
  end

  def validate
    res = CartoDB::Connection.query "SELECT GeometryType(the_geom) AS geom_type FROM #{@table_name} LIMIT 1"
    first_row = res.rows.first
    puts first_row.inspect
    if first_row && first_row[:geom_type] == 'MULTIPOLYGON'
      # http://postgis.17.n6.nabble.com/Convert-multipolygons-to-separate-polygons-td3555935.html
      res = CartoDB::Connection.query "SELECT GeometryType((ST_Dump(the_geom)).geom) AS geom_type FROM #{@table_name} GROUP BY geom_type"
      res.rows.each do |row|
        return false if row[:geom_type] != 'POLYGON'
      end
      return true
    end
    return false
  end

  def insert_into_polygons
    puts "inserting data into polygons"
    #create a lookup hash with class names / ids mapping
    polygon_classes = PolygonClass.select('id, name').all
    polygon_classes_mapping = Hash[*polygon_classes.map do |c|
        [c.name, c.id]
    end.flatten]
    puts polygon_classes_mapping.inspect

    #read data in batches of 1000
    page = 1
    puts @table_name
    begin
      res = CartoDB::Connection.query "SELECT #{@class_field}, #{@name_field}, the_geom AS the_master_geom FROM #{@table_name}", :page => page, :rows_per_page => 1000
      #resolve class_id
      res.rows.each do |row|
        class_id = polygon_classes_mapping[row[@class_field]]
        unless class_id
          PolygonClass.create!(:name => row[@class_field])
          new_class = PolygonClass.find_by_name(row[@class_field])
          polygon_classes_mapping[new_class.name] = new_class.id
          class_id = new_class.id
        end
        CartoDB::Connection.insert_row Polygon::TABLENAME, :layer_id => @layer.id, :class_id => class_id, :the_geom => row[:the_master_geom]
      end
      page += 1
    end while !res.rows.empty?
  end

end