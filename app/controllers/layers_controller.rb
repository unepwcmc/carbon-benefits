class LayersController < ApplicationController

  def select_fields
    job_params = {
      :name_field => params[:name],
      :class_field => params[:class],
      :layer_id => params[:id]
    }
    job_id = LayerUploadJob.create(job_params)
    render :json => {:job_id => job_id, :layer_id => params[:id]}
  end

  def get_job_status
    # Get the job status
    status = Resque::Plugins::Status::Hash.get(params[:job_id])

    # Sometimes the job claims its running when cartodb has imported, so check cartodb
    if status['name'] =~ /\LayerUploadJob\((.+)\)$/
      layer_json = $1.gsub('=>', ':')
      @layer_id = JSON.parse(layer_json)['layer_id'] #use the first layer if more
    end
    carto_count = CartoDB::Connection.query("SELECT cartodb_id FROM #{LayerUploadJob::TABLENAME} WHERE layer_id = #{@layer_id}")[:total_rows]

    # Set status completed if cartodb has rows
    status['status'] = 'completed' if carto_count > 0
    render :json => status
  end

  # JSON list of the associated polygon names
  def polygon_names
    polygons = Polygon.find(:all, :conditions => {:layer_id => params[:id]}, :select => "id, name" )

    @json = []

    if polygons.present?
      @json = polygons.map do |p|
        {
          :id => p.id,
          :name => p.name
        }
      end
    end
    render :json => @json.to_json
  end

end
