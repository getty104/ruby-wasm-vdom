//Load ruby.wasm

let scriptElement = document.createElement('script');
scriptElement.src = "https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@latest/dist/browser.script.iife.js";
document.head.appendChild(scriptElement);

//Load ruby_wasm_vdom.rb
let rubyScriptElement = document.createElement('script');
rubyScriptElement.type = "text/ruby"
rubyScriptElement.chrset = "utf-8"
rubyScriptElement.innerHTML = `
require 'js'

def h(node_name, attributes, children)
  { node_name: node_name.to_s, attributes:, children: }
end

class App
  def initialize(el: "#app", state:, view:, actions:)
    @document = JS.global[:document]
    @element = el.is_a?(String) ? @document.querySelector(el) : el

    @view = view
    @state = state
    @actions = dispatch_actions(actions)
    resolve_node
  end

  private

  def dispatch_actions(actions)
    actions.each_with_object({}) do |(action_name, action), dispatched|
      dispatched[action_name] = ->(state, data) {
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
    if !@skip_render
      @skip_render = true

      render = ->() {
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

module DomManager
  module ChangeType
    None = 1
    Type = 2
    Text = 3
    Node = 4
    Value = 5
    Attr = 6
  end

  module_function

  def create_element(node_obj)
    document = JS.global[:document]

    return document.createTextNode(node_obj.to_s) unless v_node?(node_obj)

    element = document.createElement(node_obj[:node_name])
    set_attributes(element, node_obj[:attributes])
    node_obj[:children].each do |child|
      element.appendChild(create_element(child))
    end
    element
  end

  def set_attributes(target_node, attributes)
    attributes.each do |key, value|
      if event_attr?(key)
        event_name = key[2..]
        target_node.addEventListener(event_name, value)
      else
        target_node.setAttribute(key.to_s, value)
      end
    end
  end

  def update_element(parent_node, current_node_obj, new_node_obj, current_node_index = 0)
    unless current_node_obj
      parent_node.appendChild(create_element(new_node_obj))
      return
    end

    current_node = parent_node[:childNodes][current_node_index]

    unless new_node_obj
      parent_node.removeChild(current_node)
      return
    end

    change_type = change_type(current_node_obj, new_node_obj)

    case change_type
    when ChangeType::Type, ChangeType::Text, ChangeType::Node
      parent_node.replaceChild(create_element(new_node_obj), current_node)
    when ChangeType::Value
      update_value(
        current_node,
        new_node_obj[:attributes][:value]
      )
    when ChangeType::Attr
      update_attributes(
        current_node,
        current_node_obj[:attributes],
        new_node_obj[:attributes]
      )
    end

    return unless v_node?(current_node_obj) && v_node?(new_node_obj)

    [current_node_obj[:children].size, new_node_obj[:children].size].max.times do |i|
      current_node_child_obj = i < current_node_obj[:children].size ? current_node_obj[:children][i] : nil
      new_node_child_obj = i < new_node_obj[:children].size ? new_node_obj[:children][i] : nil

      update_element(
        current_node,
        current_node_child_obj,
        new_node_child_obj,
        i
      )
    end
  end

  def update_attributes(target_node, current_attributes, new_attributes)
    current_attribute_keys = current_attributes.keys
    new_attribute_keys = new_attributes.keys

    (current_attribute_keys - new_attribute_keys).each do |key|
      target_node.removeAttribute(key.to_s) unless event_attr?(key.to_s)
    end

    new_attributes.each do |key, value|
      target_node.setAttribute(key.to_s, value) unless event_attr?(key.to_s) && current_attributes[key] != value
    end
  end

  def update_value(target, new_value)
    target[:value] = new_value
  end

  def change_type(a, b)
    return ChangeType::Type if a.class != b.class

    return ChangeType::Text if !v_node?(a) && a != b

    if v_node?(a) && v_node?(b)
      return ChangeType::Node if a[:node_name] != b[:node_name]

      return ChangeType::Value if a[:attributes][:value] != b[:attributes][:value]

      return ChangeType::Attr if a[:attributes].to_s != b[:attributes].to_s
    end

    ChangeType::None
  end

  def v_node?(node)
    node.is_a?(Hash)
  end

  def event_attr?(attribute)
    /^on/.match?(attribute)
  end
end

module DomParser
  module_function

  def parse(doc)
    parser = JS.eval('return new DOMParser()')
    document = parser.call(:parseFromString, JS.try_convert(doc), 'text/html')
    elements = document.getElementsByTagName('body')[0][:childNodes]

    build_vdom(elements)
  end

  def build_vdom(elements)
    vdom = []
    elements.forEach do |element|
      if element[:nodeType] == JS.global[:Node][:TEXT_NODE]
        value = element[:nodeValue].to_s.chomp.strip

        next if value.empty?

        vdom << if embed_script?(value)
                  get_embed_script(value)
                else
                  "'#{value}'"
                end

        next
      end

      attributes_str = []
      attributes = element[:attributes]
      length = attributes[:length].to_i
      length.times do |i|
        attribute = attributes[i]
        key = attribute[:name].to_s
        value = attribute[:value].to_s

        result = if embed_script?(value)
                   script = get_embed_script(value)
                   ":#{key} => #{script}"
                 else
                   ":#{key} => '#{value}'"
                 end
        attributes_str << result
      end

      vdom << "h(:#{element[:tagName].to_s.downcase}, {#{attributes_str.join(', ')}}, [#{build_vdom(element[:childNodes])}])"
    end
    vdom.join(',')
  end

  def embed_script?(doc)
    doc.match?(/\{.+\}/)
  end

  def get_embed_script(script)
    script.gsub(/\{(.+)\}/) { ::Regexp.last_match(1) }
  end
end
`
document.body.appendChild(rubyScriptElement);
