class ApiController < ApplicationController

  def create_work
    work = Work.create
    render :json => work.to_json
  end

  def work
    if params[:work_hash] && params[:work_hash] != 'undefined'
      work = Work.find(params[:work_hash].alphadecimal - Work::BASE_ID)
      render :json => work.export_to_json
    else
      render :json => ''
    end
  end

  def update_work
    if params[:work_hash] && params[:work_hash] != 'undefined'
      work = Work.find(params[:work_hash].alphadecimal - Work::BASE_ID)
      work.import_from_json(params[:_json])
      work.json = params[:_json].to_json
      work.save
      render :json => params[:_json]
    else
      render :json => ''
    end
  end

  def destroy_work
    if params[:work_hash] && params[:work_hash] != 'undefined'
      work = Work.find(params[:work_hash].alphadecimal - Work::BASE_ID)
      work.delete
      render :json => ''
    end
  end

  def proxy
    require 'net/http'
    #due to the protection against path traversal provided by Rack::Protection
    #the URLs that are matched with (.*) are sanitized and they lose the double forward-slash.
    #the following line is to fix that. =)
    url = params[:url].sub(/(http|https)(:\/)/, '\1\2/')
    uri = URI.parse(url)
    if params[:q]
      query = CGI::escape(params[:q])
      proxy_page = Net::HTTP.get_response(uri.host, uri.path+"?q=#{query}")
    elsif request.method == "POST"
      proxy_page = Net::HTTP.post_form(uri, data: params[:data])
    else
      proxy_page = Net::HTTP.get_response(uri)
    end
    render :json => proxy_page.body
  end

  def error
    Error.create(:error => params)
    render :text => "Error logged, thanks!"
  end

  def upload_layer_file
    @layer = Layer.find(params[:layer_id])
    unless @layer.update_attributes(params[:layer].merge({:is_uploaded => true}))
      render :json => {:status => :error, :data => @layer.errors.messages}
    else
      render :json => {:status => :success, :data => JSON.parse(@layer.meta_data)}
    end
  end

end
