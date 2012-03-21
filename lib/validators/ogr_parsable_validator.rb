class OgrParsableValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    if record.user_layer_file.queued_for_write[:original]
      unless system("ogrinfo -so #{record.user_layer_file.queued_for_write[:original].path}")
        record.errors[attribute] << 'File cannot be parsed. Possible character encoding problem.'
      end
    end
  end
end