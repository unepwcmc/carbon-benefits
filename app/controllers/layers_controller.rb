class LayersController < ApplicationController

  def select_fields
    @layer = Layer.find(params[:id])
  end
end
