module RubyWasmVdom
  class Router
    class << self
      private attr_reader :routes

      def define(routes)
        @routes = routes

        document = JS.global[:document]

        document.addEventListener('popstate') do |event|
          event.state => { state:, view:, actions: }
          App.new(state:, view:, actions:)
        end

        path = JS.global[:location][:pathname]
        render(path)
      end

      def navigate(path, current_page)
        history = JS.global[:history]
        history.pushState(current_page, '', path)
        render(path)
      end

      private

      def render(path)
        next_page = routes[path]
        App.new(next_page)
      end
    end
  end
end
