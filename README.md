# ruby-wasm-vdom
This is a library for using virtual dom in ruby with web assembly.

## How to use

You can use this library by adding the following to your html file.

```html
<html>
  <head>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://getty104.github.io/ruby-wasm-vdom/index.js"></script>
    <script type="text/ruby">
      state = {
        count: 0,
      }

      actions = {
        increment: ->(state, value) {
        state[:count] += 1
        }
      }

      view = ->(state, actions) {
        h(:div, {}, [
          h(:button, { onclick: ->(e) { actions[:increment].call(state, nil) } }, ['Click me!']),
          h(:p, {}, ["Count is #{state[:count]}"])
        ])
      }

      RubyWasmVdom::App.new(
        el: "#app",
        state:,
        view:,
        actions:
      )
    </script>
  </body>
</html>
```

You can also write vdom with like jsx signature with `DomParser`

```html
<html>
  <head>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://getty104.github.io/ruby-wasm-vdom/index.js"></script>
    <script type="text/ruby">
      state = {
        count: 0,
      }

      actions = {
        increment: ->(state, value) {
        state[:count] += 1
        }
      }

      view = ->(state, actions) {
        eval DomParser.parse(<<-DOM)
          <div>
            <button onclick='{->(e) { actions[:increment].call(state, nil) } }'>Click me!</button>
            <p>{"Count is #{state[:count]}"}</p>
          </div>
        DOM
      }

      RubyWasmVdom::App.new(
        el: "#app",
        state:,
        view:,
        actions:
      )
    </script>
  </body>
</html>
```

## Examples

- getty104/ruby-brainfuck-interpreter
  - Source Code: https://github.com/getty104/ruby-brainfuck-interpreter/
  - Demo: https://getty104.github.io/ruby-brainfuck-interpreter/
