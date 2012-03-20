module Paperclip
  class MetaDataExtractor < Processor

    def initialize(file, options = {}, attachment = nil)
      super
      @file = file
      @basename = File.basename(file.path, File.extname(file.path))
      @attachment_dir = File.dirname(attachment.path)
    end

    def unzip
      require 'zip/zip'

      Zip::ZipFile.open(@file) do |zip_file|
        zip_file.each do |f|
          f_path=File.join(@attachment_dir, f.name)
          FileUtils.mkdir_p(File.dirname(f_path))
          zip_file.extract(f, f_path) unless File.exist?(f_path)
        end
      end
    end

    def extract_meta_data_from_shp(file_path)
      cmd = "-so #{file_path} #{File.basename(file_path, '.shp')}"
      begin
        output = Paperclip.run('ogrinfo', cmd)
        attributes = []
        output.each_line do |l|
          if l =~ /^(.+): .+$/
            unless ['INFO', 'Layer Name', 'Geometry', 'Feature Count', 'Extent', 'Layer SRS WKT'].include? $1
              attributes<< $1
            end
          end
        end
        attributes
      rescue PaperclipCommandLineError
        raise PaperclipError, "There was an error processing shapefile #{@basename}"
      end
    end

    def make
      @meta_file, @meta_method = case @file.content_type
        when 'text/csv'
          [@file.path, :csv]
        when 'application/json'
          [@file.path, :geojson]
        when 'application/vnd.google-earth.kml+xml'
          [@file.path, :kml]
        when 'application/zip'
          unzip
          ['shp', 'csv', 'json', 'kml'].each do |format|
            files = Dir[File.join(@attachment_dir, "*.#{format}")]
            unless files.empty?
              break [files.first, format]
            end
            [@file.path, nil]
          end
        else
          return [@file.path, nil]
      end

      if @meta_method.nil?
        raise PaperclipError, "No extraction method for #{@basename}"
      end
      attributes = self.send("extract_meta_data_from_#{@meta_method}", @meta_file)
      #save extracted attributes
      dst = Tempfile.new([@basename, 'meta'].compact.join("."))
      dst << attributes.to_json
      dst
    end
  end
end