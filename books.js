// ====================
// BOOKSHELF
// ====================

const API = "/api";
const KEY_STORAGE = "booksAdminKey";

const readShelf = document.getElementById("read-shelf");
const readingShelf = document.getElementById("reading-shelf");
const readingSection = document.getElementById("reading-section");
const statusEl = document.getElementById("books-status");
const countEl = document.getElementById("books-count");

let books = [];
let adminKey = getStoredKey();
let isAdmin = false;


// ====================
// LOADING + RENDERING
// ====================

async function loadBooks() {
    try {
        const res = await fetch(`${API}/books`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.status);
        books = data.books;
        render();
    } catch (e) {
        console.error(e);
        statusEl.textContent = "Couldn't load the bookshelf right now.";
        statusEl.hidden = false;
    }
}

function render() {
    const reading = books.filter(b => b.status === "reading");
    const read = books.filter(b => b.status !== "reading");

    countEl.textContent = `${read.length} book${read.length === 1 ? "" : "s"} read`;
    statusEl.hidden = books.length > 0;
    statusEl.textContent = "No books yet.";

    readingSection.hidden = reading.length === 0;
    readingShelf.replaceChildren(...reading.map((b, i) => bookCard(b, i, reading.length)));
    readShelf.replaceChildren(...read.map((b, i) => bookCard(b, i, read.length)));
}

function bookCard(book, index, total) {
    const card = el("article", "book");
    card.dataset.isbn = book.isbn;

    const cover = el("div", "book-cover");
    if (book.cover_url) {
        const img = document.createElement("img");
        img.src = book.cover_url;
        img.alt = `Cover of ${book.title}`;
        img.loading = "lazy";
        img.addEventListener("error", () => img.replaceWith(coverPlaceholder(book)));
        cover.appendChild(img);
    } else {
        cover.appendChild(coverPlaceholder(book));
    }
    card.appendChild(cover);

    const body = el("div", "book-body");
    body.appendChild(el("h4", "book-title", book.title));
    if (book.authors) body.appendChild(el("p", "book-author", book.authors));

    // Everything below only shows in list view
    if (book.finished) body.appendChild(el("p", "book-finished", "Finished " + formatMonth(book.finished)));
    if (book.description) body.appendChild(el("p", "book-desc", book.description));

    const meta = [
        book.published_year,
        book.page_count && `${book.page_count} pages`,
        book.publisher,
        `ISBN ${book.isbn}`,
    ].filter(Boolean).join(" · ");
    body.appendChild(el("p", "book-meta", meta));

    if (isAdmin) body.appendChild(adminButtons(book, index, total));
    card.appendChild(body);

    // In grid view, clicking a book jumps to it in list view
    card.addEventListener("click", e => {
        if (currentView !== "grid" || e.target.closest(".book-admin")) return;
        setView("list");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("highlight");
        setTimeout(() => card.classList.remove("highlight"), 1600);
    });

    return card;
}

function coverPlaceholder(book) {
    const ph = el("div", "cover-placeholder");
    ph.appendChild(el("span", "", book.title));
    return ph;
}

function formatMonth(yyyyMm) {
    const [y, m] = yyyyMm.split("-").map(Number);
    return new Date(y, m - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}


// ====================
// LIST / GRID TOGGLE
// ====================

let currentView = "list";
const viewButtons = document.querySelectorAll(".view-toggle button");

function setView(view) {
    currentView = view;
    [readShelf, readingShelf].forEach(shelf => {
        shelf.classList.toggle("grid-view", view === "grid");
        shelf.classList.toggle("list-view", view === "list");
    });
    viewButtons.forEach(btn => {
        const active = btn.dataset.view === view;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active);
    });
}

viewButtons.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));


// ====================
// ADMIN: LOGIN
// ====================

const loginPanel = document.getElementById("admin-login");
const toolsPanel = document.getElementById("admin-tools");
const loginMessage = document.getElementById("login-message");

function getStoredKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ""; } catch (e) { return ""; }
}

function storeKey(key) {
    try {
        if (key) localStorage.setItem(KEY_STORAGE, key);
        else localStorage.removeItem(KEY_STORAGE);
    } catch (e) {}
}

async function api(path, options = {}) {
    const res = await fetch(API + path, {
        ...options,
        headers: {
            "Authorization": `Bearer ${adminKey}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) logout();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

async function checkAdmin() {
    if (adminKey) {
        try {
            await api("/auth");
            setAdmin(true);
            return;
        } catch (e) {
            adminKey = "";
            storeKey("");
        }
    }
    // The login box only appears at /books?admin
    loginPanel.hidden = !new URLSearchParams(location.search).has("admin");
}

function setAdmin(on) {
    isAdmin = on;
    toolsPanel.hidden = !on;
    if (on) loginPanel.hidden = true;
    render();
}

function logout() {
    adminKey = "";
    storeKey("");
    setAdmin(false);
}

document.getElementById("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    adminKey = document.getElementById("login-password").value;
    loginMessage.textContent = "";
    try {
        await api("/auth");
        storeKey(adminKey);
        setAdmin(true);
    } catch (err) {
        adminKey = "";
        loginMessage.textContent = err.message;
    }
});

document.getElementById("logout-button").addEventListener("click", logout);


// ====================
// ADMIN: ADD / EDIT
// ====================

const editor = document.getElementById("book-editor");
const form = document.getElementById("editor-form");
const coverPreview = document.getElementById("editor-cover-preview");
const coverEmpty = document.getElementById("editor-cover-empty");
const editorNotice = document.getElementById("editor-notice");
const lookupMessage = document.getElementById("lookup-message");
let editingIsbn = null;

document.getElementById("lookup-form").addEventListener("submit", async e => {
    e.preventDefault();
    const input = document.getElementById("lookup-isbn");
    const button = e.submitter;
    lookupMessage.textContent = "Looking it up…";
    button.disabled = true;
    try {
        const { book } = await api(`/lookup?isbn=${encodeURIComponent(input.value)}`);
        lookupMessage.textContent = "";
        input.value = "";
        openEditor(
            { ...book, status: "read", finished: thisMonth() },
            null,
            book.found ? "" : "No details found for this ISBN. Fill them in yourself."
        );
    } catch (err) {
        lookupMessage.textContent = err.message;
    } finally {
        button.disabled = false;
    }
});

function openEditor(book, isbnBeingEdited, notice = "") {
    editingIsbn = isbnBeingEdited;
    document.getElementById("editor-title").textContent = isbnBeingEdited ? "Edit book" : "Add book";
    editorNotice.textContent = notice;

    for (const field of form.elements) {
        if (field.name) field.value = book[field.name] ?? "";
    }
    syncFinished();
    syncCover();
    editor.showModal();
}

function thisMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// The month finished only applies to finished books
function syncFinished() {
    const reading = form.elements.status.value === "reading";
    form.elements.finished.disabled = reading;
    if (!reading && !form.elements.finished.value) form.elements.finished.value = thisMonth();
}

function syncCover() {
    const url = form.elements.cover_url.value.trim();
    coverPreview.hidden = !url;
    coverEmpty.hidden = Boolean(url);
    if (url) coverPreview.src = url;
}

form.elements.status.addEventListener("change", syncFinished);
form.elements.cover_url.addEventListener("input", syncCover);
coverPreview.addEventListener("error", () => { coverPreview.hidden = true; coverEmpty.hidden = false; });
document.getElementById("editor-cancel").addEventListener("click", () => editor.close());

form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const save = document.getElementById("editor-save");
    save.disabled = true;
    editorNotice.textContent = "";
    try {
        if (editingIsbn) {
            await api(`/books/${editingIsbn}`, { method: "PUT", body: JSON.stringify(data) });
        } else {
            await api("/books", { method: "POST", body: JSON.stringify(data) });
        }
        editor.close();
        await loadBooks();
    } catch (err) {
        editorNotice.textContent = err.message;
    } finally {
        save.disabled = false;
    }
});


// ====================
// ADMIN: MOVE / DELETE
// ====================

function adminButtons(book, index, total) {
    const row = el("div", "book-admin");

    const up = iconButton("fa-arrow-up", "Move up (more recent)", index === 0);
    up.addEventListener("click", () => move(book.isbn, "up"));
    const down = iconButton("fa-arrow-down", "Move down (earlier)", index === total - 1);
    down.addEventListener("click", () => move(book.isbn, "down"));

    const edit = el("button", "btn-small", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => openEditor(book, book.isbn));

    // Two-step delete instead of a confirm() popup
    const del = el("button", "btn-small btn-danger", "Delete");
    del.type = "button";
    let armed = null;
    del.addEventListener("click", async () => {
        if (!armed) {
            del.textContent = "Really delete?";
            armed = setTimeout(() => { del.textContent = "Delete"; armed = null; }, 3000);
            return;
        }
        clearTimeout(armed);
        try {
            await api(`/books/${book.isbn}`, { method: "DELETE" });
            await loadBooks();
        } catch (err) {
            alertInline(err.message);
        }
    });

    row.append(up, down, edit, del);
    return row;
}

function iconButton(icon, label, disabled) {
    const btn = el("button", "btn-small");
    btn.type = "button";
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.disabled = disabled;
    btn.innerHTML = `<i class="fas ${icon}"></i>`;
    return btn;
}

async function move(isbn, direction) {
    try {
        await api(`/books/${isbn}/move`, { method: "POST", body: JSON.stringify({ direction }) });
        await loadBooks();
    } catch (err) {
        alertInline(err.message);
    }
}

function alertInline(message) {
    lookupMessage.textContent = message;
}


// ====================
// START
// ====================

loadBooks().then(checkAdmin);
