class LayersController < ApplicationController

  def select_fields
    job_params = {
      :name_field => params[:name],
      :class_field => params[:class],
      :layer_id => params[:id]
    }
    job_id = LayerUploadJob.create(job_params)
    render :json => {:job_id => job_id}
  end

  def get_job_status
    render :json => Resque::Plugins::Status::Hash.get(params[:job_id])
  end

end
