ENV["RAILS_ENV"] = "test"
require File.expand_path("../../config/environment", __FILE__)
require 'minitest/autorun'
require 'minitest/mock'
require 'active_support/testing/setup_and_teardown'

class IntegrationTest < MiniTest::Spec
  include Rails.application.routes.url_helpers
  register_spec_type(/integration$/, self)
end

class HelperTest < MiniTest::Spec
  include ActiveSupport::Testing::SetupAndTeardown
  include ActionView::TestCase::Behavior
  register_spec_type(/Helper$/, self)
end

Turn.config.format = :outline