import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  highlight: function (str, lang) {
    const langName = lang && hljs.getLanguage(lang) ? lang : ''
    let highlighted
    if (langName) {
      try {
        highlighted = hljs.highlight(str, { language: langName, ignoreIllegals: true }).value
      } catch (_) {
        highlighted = md.utils.escapeHtml(str)
      }
    } else {
      highlighted = md.utils.escapeHtml(str)
    }
    const langLabel = langName ? '<span class="code-lang-label">' + langName + '</span>' : ''
    const copyId = 'cpy_' + Math.random().toString(36).slice(2, 8)
    return (
      '<div class="code-block-wrapper">' +
        '<div class="code-block-header">' +
          langLabel +
          '<button class="code-copy-btn" onclick="(function(btn){' +
            "var wrapper = btn.closest('.code-block-wrapper');" +
            'var code = wrapper.querySelector(\'code\');' +
            'var text = code.textContent || code.innerText;' +
            "navigator.clipboard.writeText(text).then(function(){" +
              "btn.textContent = '\u2713 \u5df2\u590d\u5236';" +
              "setTimeout(function(){ btn.textContent = '\u590d\u5236\u4ee3\u7801'; }, 2000);" +
            "}).catch(function(){" +
              "var ta = document.createElement('textarea');" +
              'ta.value = text; document.body.appendChild(ta);' +
              'ta.select(); document.execCommand(\'copy\');' +
              'document.body.removeChild(ta);' +
              "btn.textContent = '\u2713 \u5df2\u590d\u5236';" +
              "setTimeout(function(){ btn.textContent = '\u590d\u5236\u4ee3\u7801'; }, 2000);" +
            '})' +
          '})(this)">\u590d\u5236\u4ee3\u7801</button>' +
        '</div>' +
        '<pre class="hljs"><code>' + highlighted + '</code></pre>' +
      '</div>'
    )
  }
})

export default md