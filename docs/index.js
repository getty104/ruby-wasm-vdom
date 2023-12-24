//Load ruby.wasm

let scriptElement = document.createElement('script');
scriptElement.src = "https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@latest/dist/browser.script.iife.js";
document.head.appendChild(scriptElement);

function loadRubyScript(filePath) {
  const baseUrl = "https://getty104.github.io/ruby-wasm-vdom";
  let rubyScriptElement = document.createElement('script');
  rubyScriptElement.type = "text/ruby"
  rubyScriptElement.chrset = "utf-8"
  rubyScriptElement.src = `${baseUrl}/${filePath}`;
  document.head.appendChild(rubyScriptElement);
}

//Load ruby_wasm_vdom.rb
loadRubyScript("ruby_wasm_vdom.rb");
loadRubyScript("ruby_wasm_vdom/init.rb");
loadRubyScript("ruby_wasm_vdom/dom_parser.rb");
loadRubyScript("ruby_wasm_vdom/dom_manager.rb");
loadRubyScript("ruby_wasm_vdom/app.rb");
loadRubyScript("ruby_wasm_vdom/router.rb");
