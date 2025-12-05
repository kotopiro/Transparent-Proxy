export function initDrag(container, tabsInstance){
  let dragEl = null;
  container.addEventListener('dragstart', (e) => {
    dragEl = e.target;
    e.dataTransfer.setData('text/plain', dragEl.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getDragAfterElement(container, e.clientX);
    const draggedId = e.dataTransfer.getData('text/plain');
    const dragged = document.querySelector(`[data-id="${draggedId}"]`);
    if(after == null) container.appendChild(dragged);
    else container.insertBefore(dragged, after);
  });

  function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.tab-pill:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}
