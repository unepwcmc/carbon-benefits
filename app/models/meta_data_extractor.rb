class MetaDataExtractor
  def initialize(attachment)
    @file = attachment.queued_for_write[:original]
    @file_dir = File.dirname(attachment.path)
  end

  def unzip
    require 'zip/zip'

    Zip::ZipFile.open(@file.path) do |zip_file|
      zip_file.each do |f|
        f_path=File.join(@file_dir, f.name)
        FileUtils.mkdir_p(File.dirname(f_path))
        zip_file.extract(f, f_path) unless File.exist?(f_path)
      end
    end
  end

  def extract_meta_data_from_ogrinfo
    #get the layers first
    layers_cmd = "-so \"#{@meta_file}\""
    layers_output = Paperclip.run('ogrinfo', layers_cmd)
    if layers_output =~ /\d+: (.+) \(.+\)$/
      @layer_name = $1 #use the first layer if more
    end
    raise "No layers detected" unless @layer_name
    #get this layer's attributes
    attributes_cmd = "-so \"#{@meta_file}\" \"#{@layer_name}\""
    attributes_output = Paperclip.run('ogrinfo', attributes_cmd)
    attributes = []
    attributes_output.each_line do |l|
      if l =~ /^(.+): .+$/
        unless ['INFO', 'Layer name', 'Geometry', 'Feature Count', 'Extent', 'Layer SRS WKT'].include? $1
          attributes<< $1
        end
      end
    end
    attributes.map{ |a| a[0..9] }
  end

  def make
    @meta_file = case @file.content_type
      when 'application/zip'
        unzip
        ['shp', 'kml', 'kmz', 'json', 'geojson', 'csv'].each do |format|
          files = Dir[File.join(@file_dir, "**", "*.#{format}")]
          unless files.empty?
            break files.first
          end
          @file.path
        end
      else
        @file.path
    end
    extract_meta_data_from_ogrinfo
  end

end