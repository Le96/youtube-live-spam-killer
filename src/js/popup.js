window.onload = () => {
  var debugCheckbox = document.getElementById('debug')
  chrome.storage.local.get(['debugMode'], value => {
    debugCheckbox.checked = value.debugMode ?? false
  })
  debugCheckbox.onchange = () => {
    var debugModeMsg = { debugMode: debugCheckbox.checked }
    chrome.storage.local.set(debugModeMsg)
  }
}