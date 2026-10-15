export default function decorate(block) {
  // Imported nav/footer fragments can contain an empty backend marker with no
  // authored robot directives. Remove only that empty marker; keep future content.
  if (!block.textContent.trim() && !block.querySelector('a, img, picture, input, meta')) {
    block.remove();
  }
}
