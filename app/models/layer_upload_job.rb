class LayerUploadJob
  include Resque::Plugins::Status

  def perform
    @layer = Layer.find(options['layer_id'])
    @layer_file = @layer.user_layer_file

    #first upload raw file to cartodb
    puts "uploading to new table"
    res = CartoDB::Connection.create_table '', @layer_file.to_file
    puts res.inspect
    @table_name = res[:name]
    #now do the copying and stuff into polygons table
    puts 'copying to polygons'
    #TODO
    #now delete the raw table
    #TODO
    puts 'deleting the new table'
  end

end