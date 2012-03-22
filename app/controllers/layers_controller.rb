class LayersController < ApplicationController

  def select_fields
    @layer = Layer.find(params[:id])
    job_params = {
      :name_field => params[:name],
      :class_field => params[:class],
      :layer => @layer
    }
    job_id = LayerUploadJob.create(job_params)
    #return this id to the front end and tie it to the layer tab somehow to show progress
  end
end
