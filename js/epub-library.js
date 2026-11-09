/* Recent EPUBs live in IndexedDB so reopening does not need another file picker. */
const MAX_RECENT_BOOKS = 10;
const books = new Map();
let databasePromise, loadedPromise;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise(resolve => {
      try {
        const request = indexedDB.open('knickknacks-epub', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('books', { keyPath: 'id' });
        request.onsuccess = () => {
          request.result.onversionchange = () => request.result.close();
          resolve(request.result);
        };
        request.onerror = request.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  return databasePromise;
}

async function useStore(mode, action) {
  const database = await openDatabase();
  if (!database) return null;
  return new Promise(resolve => {
    try {
      const transaction = database.transaction('books', mode);
      const request = action(transaction.objectStore('books'));
      transaction.oncomplete = () => resolve(request ? request.result : true);
      transaction.onerror = transaction.onabort = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}

function loadBooks() {
  if (!loadedPromise) {
    loadedPromise = useStore('readonly', store => store.getAll()).then(saved => {
      for (const entry of saved || []) books.set(entry.id, entry);
    });
  }
  return loadedPromise;
}

function sortedBooks() {
  return Array.from(books.values()).sort((a, b) => b.lastOpened - a.lastOpened);
}

export async function getRecentBooks() {
  await loadBooks();
  return sortedBooks().map(({ file, ...metadata }) => metadata);
}

export async function getRecentBook(id) {
  await loadBooks();
  return books.get(id);
}

export async function rememberBook(entry) {
  await loadBooks();
  const record = { ...entry, lastOpened: Date.now() };
  books.set(record.id, record);
  const expired = sortedBooks().slice(MAX_RECENT_BOOKS);
  expired.forEach(item => books.delete(item.id));
  // The in-memory list remains usable for this session if browser storage is unavailable.
  await useStore('readwrite', store => {
    store.put(record);
    expired.forEach(item => store.delete(item.id));
  });
}

export async function forgetBook(id) {
  await loadBooks();
  books.delete(id);
  await useStore('readwrite', store => store.delete(id));
}
