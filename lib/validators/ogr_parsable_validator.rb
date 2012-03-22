class OgrParsableValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    queued_file = record.user_layer_file.queued_for_write[:original]
    if queued_file && File.extname(queued_file.path) != '.zip'
      unless system("ogrinfo -so #{queued_file.path}")
        record.errors[attribute] << 'File cannot be parsed. Possible character encoding problem.'
      end
    end
  end
end