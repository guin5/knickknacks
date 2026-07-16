const input = document.getElementById('wcInput');
const highlight = document.getElementById('wcHighlight');
const wcWords = document.getElementById('wcWords');
const wcChars = document.getElementById('wcChars');
const wcCharsNoSpace = document.getElementById('wcCharsNoSpace');
const wcSentences = document.getElementById('wcSentences');
const wcParagraphs = document.getElementById('wcParagraphs');
const wcReadTime = document.getElementById('wcReadTime');
const wcWordLimit = document.getElementById('wcWordLimit');
const wcCharLimit = document.getElementById('wcCharLimit');

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function syncScroll() {
  highlight.scrollTop = input.scrollTop;
  highlight.scrollLeft = input.scrollLeft;
}

function renderHighlight(text, wordLimit, charLimit) {
  let splitIndex = text.length;
  if (charLimit > 0 && charLimit < splitIndex) splitIndex = charLimit;
  if (wordLimit > 0) {
    let wordCount = 0, inWord = false;
    for (let i = 0; i < text.length; i++) {
      const isSpace = text[i] === ' ' || text[i] === '\n' || text[i] === '\t' || text[i] === '\r';
      if (!isSpace && !inWord) { wordCount++; inWord = true; }
      else if (isSpace) { inWord = false; }
      if (wordCount >= wordLimit && (isSpace || i === text.length - 1)) {
        splitIndex = Math.min(splitIndex, i + 1);
        break;
      }
    }
  }
  if (splitIndex > 0 && splitIndex < text.length) {
    highlight.innerHTML = '<mark>' + escapeHtml(text.slice(0, splitIndex)) + '</mark>' + escapeHtml(text.slice(splitIndex));
  } else {
    highlight.innerHTML = '';
  }
}

function count() {
  const text = input.value;
  const trimmed = text.trim();

  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
  const readSec = Math.round(words / 200 * 60);
  const readTime = readSec < 60 ? readSec + 's'
    : readSec < 600 ? Math.floor(readSec / 60) + 'm ' + (readSec % 60) + 's'
    : Math.round(readSec / 60) + 'm';

  const wl = parseInt(wcWordLimit.value, 10) || 0;
  const cl = parseInt(wcCharLimit.value, 10) || 0;

  renderHighlight(text, wl, cl);

  wcWords.textContent = words;
  wcChars.textContent = chars;
  wcCharsNoSpace.textContent = charsNoSpace;
  wcSentences.textContent = sentences;
  wcParagraphs.textContent = paragraphs;
  wcReadTime.textContent = readTime;
}

input.addEventListener('input', count);
input.addEventListener('scroll', syncScroll);
wcWordLimit.addEventListener('input', count);
wcCharLimit.addEventListener('input', count);
