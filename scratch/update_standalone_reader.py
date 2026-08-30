import re

# Restore backup or read bundle.js
with open('js/bundle.js', 'r', encoding='utf-8') as f:
    code = f.read()

new_open_fn = """  function openFullpageComicReader(item) {
    try {
      localStorage.setItem('pending_unlock_comic', item.id);
    } catch (e) {}

    if (window.appInstance) {
      window.appInstance.activeComic = item;
      window.appInstance.currentPageIndex = 0;
      if (!window.location.search.includes('comic=' + item.id)) {
        history.pushState({}, '', '?comic=' + item.id);
      }
      window.appInstance.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }"""

start_marker = "  function openFullpageComicReader(item) {"
end_marker = "  function createComicReaderModal(item, onClose, onUnlockRequest) {"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + new_open_fn.strip() + "\n\n" + code[end_idx:]
    print("Successfully replaced openFullpageComicReader!")
else:
    print(f"Error finding markers: start={start_idx}, end={end_idx}")

with open('js/bundle.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("BUNDLE.JS CLEANED UP SUCCESSFULLY!")
