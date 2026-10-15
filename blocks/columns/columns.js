export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // The first imported image-and-copy pair is the homepage hero, not a generic split column.
  const section = block.closest('.section');
  const main = block.closest('main');
  if (cols.length === 2 && section === main?.querySelector(':scope > .section')
    && block.querySelector('picture') && block.querySelector('h2')) {
    block.classList.add('columns-hero');
    section.classList.add('hero-section');
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
