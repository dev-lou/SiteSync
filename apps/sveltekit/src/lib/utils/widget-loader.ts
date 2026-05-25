export async function waitForWidget(
  container: Element,
  selector: string,
  timeout = 5000,
): Promise<Element | null> {
  if (container.querySelector(selector)) return container.querySelector(selector);
  return new Promise((resolve) => {
    const start = Date.now();
    const observer = new MutationObserver(() => {
      const el = container.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      } else if (Date.now() - start > timeout) {
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(container, { childList: true, subtree: true });
  });
}
