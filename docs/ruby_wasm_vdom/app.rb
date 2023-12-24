# frozen_string_literal: true

module RubyWasmVdom
  class App
    def initialize(state:, view:, actions:, el: '#app')
      @document = JS.global[:document]
      @element = el.is_a?(String) ? @document.querySelector(el) : el

      @view = view
      @state = state
      @actions = dispatch_actions(actions)
      resolve_node
    end

    private

    def dispatch_actions(actions)
      actions.transform_values do |action|
        lambda { |state, data|
          action.call(state, data)
          resolve_node
        }
      end
    end

    def resolve_node
      @new_node_obj = @view.call(@state, @actions)
      schedule_render
    end

    def schedule_render
      return if @skip_render

      @skip_render = true

      render = lambda {
        if @current_node_obj
          DomManager.update_element(@element, @current_node_obj, @new_node_obj)
        else
          @element.appendChild(DomManager.create_element(@new_node_obj))
        end

        @current_node_obj = @new_node_obj
        @skip_render = false
      }

      JS.global.call(:setTimeout, JS.try_convert(render))
    end
  end
end
