const _DEBUG = true

var _req = new XMLHttpRequest();
_req.open('GET', './content.js', false)
_req.send('')
eval(_req.responseText)

var _normalizeTest = target => {
    var normalized = normalizeWord(target).replace(/[a-z\n\s]/g, '')
    if (_DEBUG) {
        console.group('normalizeTest result:')
        if (normalized.length !== 0) {
            console.info('Un-normalized characters: ' + Array.from(new Set(normalized.split(''))).sort().join(''))
        } else {
            console.log('All characters have been successfully normalized.')
        }
        console.groupEnd()
    }
}