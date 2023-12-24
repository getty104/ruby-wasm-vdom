# frozen_string_literal: true

module RubyWasmVdom
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
end
