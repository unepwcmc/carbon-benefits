class ApiController < ApplicationController

  def work
    if params[:work_hash] && params[:work_hash] != 'undefined'
      work = Work.find(params[:work_hash].alphadecimal - Work::BASE_ID)
    else
      work = Work.create
    end
    respond_to do |format|
      format.json { render :json => work.to_json  }
    end
  end

  def proxy
  end

  def error
    render :nothing => true
  end
end
