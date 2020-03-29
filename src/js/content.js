var _DEBUG = null
chrome.storage.local.get(['debugMode'], item => {
  // debugModeの初期値を取得、未設定ならばfalseとする
  _DEBUG = item['debugMode'] ?? false
})

// 正規化後にスパム判定する文字列群
const BLACKLIST_WORDS = [
  'chat',
  'click',
  'colona',
  'here',
  'hot',
  'hot',
  'hotty',
  'i',
  'join',
  'live',
  'love',
  'mask',
  'me',
  'me',
  'photo',
  'sex',
  'tap',
]
// 正規化マップ
const NORMALIZE_MAP = {
  a: /[ᴀᗩɐ]/gu,
  b: null,
  c: /[ᴄᑕꮯᏟ]/gu,
  d: null,
  e: /[3ǝᴇᎬє]/gu,
  f: null,
  g: null,
  h: /[ʜнᕼ]/gu,
  i: /[ɪιᎥí]/gu,
  j: /[ᴊ]/gu,
  k: /[ᴋꮶᏦ]/gu,
  l: /[ʟᏞᒪ]/gu,
  m: /[ᴍᗰ]/gu,
  n: /[ɴᑎ]/gu,
  o: /[0ᴏσ]/gu,
  p: /[ᴘ]/gu,
  q: null,
  r: /[ʀ]/gu,
  s: /[ꜱ]/gu,
  t: /[тᴛ]/gu,
  u: null,
  v: /[Ꮙᴠ]/gu,
  w: null,
  x: null,
  y: /[ʏ]/gu,
  z: null
}

var normalizeWord = word => {
  word = word.replace(/[!-/:-@\[-`{-~]/g, '')
  Object.keys(NORMALIZE_MAP).forEach(key => {
    word = word.replace(NORMALIZE_MAP[key], key)
  })
  return word.toLowerCase()
}

var loadWait = () => {
  if (_DEBUG)
    console.log('loadWait')
  var trial = setInterval(() => {
    // for youtube.com/live_chat*
    if (document.querySelector('#items.yt-live-chat-item-list-renderer')) {
      clearInterval(trial)
      main(document)
    }
    // for youtube.com/watch*
    var chatframe = document.getElementById('chatframe')
    if (!chatframe)
      return
    var chatdoc = chatframe.contentWindow.document
    if (chatdoc.querySelector('#items.yt-live-chat-item-list-renderer')) {
      clearInterval(trial)
      main(chatdoc)
    }
  }, 1000)
}

var main = targetDoc => {
  if (_DEBUG)
    console.log('main')
  var target = targetDoc.querySelector('#items.yt-live-chat-item-list-renderer')
  var observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => spamCheck(targetDoc, node))
    })
  })
  observer.observe(target, {
    childList: true
  })
}

var commentHistory = []
var blacklist = {}
const SIZE_THRESH = 1000
const HIDE_THRESH = 3
var spamCheck2 = (targetDoc, item) => {
  var author = item.querySelector('#author-name').textContent.trim()
  var isMember = Boolean(item.querySelector('[type="member"]'))
  var msg = item.querySelector('#message').textContent.trim()

  // 以前のコメントを走査、前方一致した場合グレーとする
  if (commentHistory.find(comment => !comment.msg.indexOf(msg))) {
    if (author in blacklist)
      blacklist[author]++
    else
      blacklist[authorName] = 1
  }

  // サイズ調整、オーバーした場合トリム
  if (commentHistory.length > SIZE_THRESH)
    commentHistory.shift()
  commentHistory.push({ author: author, msg: msg })

  // Blacklistを調べて一定回数以上引っかかっている場合非表示化
  if (author in blacklist && !isMember && blacklist[author] >= HIDE_THRESH)
    hide(targetDoc, item)
}

var spamCheck = (targetDoc, item) => {
  var authorName = item.querySelector('#author-name').textContent
  var message = item.querySelector('#message').textContent
  var emoji = item.querySelector('img.emoji')

  var parsedName = authorName.replace(/^[A-Za-z]+/, '').trim()
  var suspCounter = 0
  var suspWords = parsedName.split(/\s+/)
  suspWords.forEach(suspWord => {
    if (BLACKLIST_WORDS.includes(normalizeWord(suspWord)))
      suspCounter++
  })
  var suspRate = 0
  if (suspWords.length >= 3)
    suspRate += suspCounter / suspWords.length * 100

  if (suspRate > 50 && emoji) {
    // re-acquire location of item
    var target = targetDoc.getElementById(item.getAttribute('id'))
    target.parentNode.removeChild(target)
    console.group(authorName + ': ' + message)
    console.info('Suspicious Rate: ' + suspRate.toFixed(2) + '%. Emoji found.')
    console.info('Marked as spam.')
    console.groupEnd()
  } else if (_DEBUG) {
    console.group(authorName + ': ' + message)
    console.log('Suspicious Rate: ' + suspRate.toFixed(2) + '%.')
    console.groupEnd()
  }
}

window.onload = loadWait