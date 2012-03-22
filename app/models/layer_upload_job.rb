class LayerUploadJob
  include Resque::Plugins::Status

  def perform
    #first upload raw file to cartodb
    #TODO
    puts 'upoloading...'
    #now do the copying and stuff into polygons table
    puts 'copying'
    #TODO
    #now delete the raw table
    #TODO
    puts 'deleting'
  end

end