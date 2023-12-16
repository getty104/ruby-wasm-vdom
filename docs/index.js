//Load ruby.wasm

let scriptElement = document.createElement('script');
scriptElement.src = "https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@latest/dist/browser.script.iife.js";
document.head.appendChild(scriptElement);

//Load ruby_wasm_vdom.rb
let rubyScriptElement = document.createElement('script');
rubyScriptElement.type = "text/ruby"
rubyScriptElement.chrset = "utf-8"
rubyScriptElement.src = "https://getty104.github.io/ruby-wasm-vdom/ruby_wasm_vdom.rb";
document.head.appendChild(rubyScriptElement);
