const BLACKLIST_WORDS = ['chat', 'click', 'here', 'hot', 'join', 'live', 'love', 'me', 'photo', 'sex', 'tap']
const NORMALIZE_MAP = {
  a: ['ᴀ', 'ᗩ'],
  c: ['ᴄ', 'ᑕ'],
  e: ['3', 'ǝ', 'ᴇ', 'Ꭼ', 'є'],
  h: ['ʜ', 'н', 'ᕼ'],
  i: ['ɪ', 'ι', 'Ꭵ', 'í'],
  j: ['ᴊ'],
  k: ['ᴋ'],
  l: ['ʟ', 'Ꮮ', 'ᒪ'],
  m: ['ᴍ', 'ᗰ'],
  n: ['ɴ', 'ᑎ'],
  o: ['0', 'ᴏ'],
  p: ['ᴘ'],
  r: ['ʀ'],
  s: ['ꜱ'],
  t: ['т', 'ᴛ'],
  v: ['Ꮙ', 'ᴠ'],
}
const SUSPICIOUS_LANGUAGES = ['Armenian', 'Cyrillic', 'Devanagari', 'Latin', 'Thai', 'Yi']

var normalizeWord = word => {
  word = word.replace(/[!-/:-@\[-`{-~]/g, '')
  Object.keys(NORMALIZE_MAP).forEach(key => {
    NORMALIZE_MAP[key].forEach(item => {
      word = word.replace(new RegExp(item, 'g'), key)
    })
  })
  return word.toLowerCase()
}

var loadWait = () => {
  var trial = setInterval(() => {
    // for youtube.com/live_chat*
    var target = document.querySelector('#items.yt-live-chat-item-list-renderer')
    if (target) {
      clearInterval(trial)
      main(document)
    }
    // for youtube.com/watch*
    var chatframe = document.getElementById('chatframe')
    if (!chatframe)
      return
    var chatdoc = chatframe.contentWindow.document
    var target = chatdoc.querySelector('#items.yt-live-chat-item-list-renderer')
    if (target) {
      clearInterval(trial)
      main(chatdoc)
    }
  }, 1000)
}

var main = (targetDoc) => {
  console.log('main start.')
  var target = targetDoc.querySelector('#items.yt-live-chat-item-list-renderer')
  var observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => spamCheck(targetDoc, node))
    })
  })
  observer.observe(target, { childList: true })
}

var spamCheck = (targetDoc, item) => {
  var authorName = item.querySelector('#author-name').textContent
  var message = item.querySelector('#message').textContent
  var emoji = item.querySelector('img.emoji')

  var parsedName = authorName.replace(/^[A-Za-z]+/, '').trim()
  var suspCounter = 0
  SUSPICIOUS_LANGUAGES.forEach(suspLang => {
    var targetRegExp = new RegExp('\\p{Script=' + suspLang + '}', 'u')
    if (parsedName.search(targetRegExp) !== -1)
      suspCounter++
  })
  var suspRate = suspCounter / SUSPICIOUS_LANGUAGES.length * 100

  suspCounter = 0
  var suspWords = parsedName.split(/\s+/)
  suspWords.forEach(suspWord => {
    if (BLACKLIST_WORDS.includes(normalizeWord(suspWord)))
      suspCounter++
  })
  if (suspWords.length >= 3)
    suspRate += suspCounter / suspWords.length * 100

  if (suspRate > 60 && emoji) {
    // re-locate item
    var target = targetDoc.getElementById(item.getAttribute('id'))
    // just marking
    // targetDoc.getElementById(targetId).style.backgroundColor = 'red'
    target.parentNode.removeChild(target)
    // console.warn(authorName + ': ' + message + '\nSuspicious Rate: ' + suspRate.toFixed(2) + '%. Marked as spam.')
  } else {
    // console.log(authorName + ': ' + message + '\nSuspicious Rate: ' + suspRate.toFixed(2) + '%.')
  }
}

window.onload = loadWait