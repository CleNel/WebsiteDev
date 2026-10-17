// ====================
// BOOKS API (Cloudflare Pages Function)
// ====================
//
// GET    /api/books               list all books (public)
// GET    /api/auth                check the admin password
// GET    /api/lookup?isbn=...     look an ISBN up without saving it
// POST   /api/books               add a book
// PUT    /api/books/:isbn         edit a book
// DELETE /api/books/:isbn         delete a book
// POST   /api/books/:isbn/move    { direction: "up" | "down" }
//
// Everything except the public list needs the header
// "Authorization: Bearer <ADMIN_PASSWORD>".
//
// Bindings (Cloudflare dashboard → Pages project → Settings):
//   DB                    D1 database (the table is created automatically)
//   ADMIN_PASSWORD        secret
//   GOOGLE_BOOKS_API_KEY  optional, raises the lookup rate limit

// status: 'read' or 'reading'. finished: 'YYYY-MM'. read_order: higher =
// read more recently. date_added is kept but never shown.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS books (
    isbn           TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    authors        TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    cover_url      TEXT NOT NULL DEFAULT '',
    published_year TEXT NOT NULL DEFAULT '',
    page_count     INTEGER,
    publisher      TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'read',
    finished       TEXT,
    read_order     REAL NOT NULL,
    date_added     TEXT NOT NULL DEFAULT (datetime('now'))
)`;
let schemaReady = false;

const FIELDS = ["title", "authors", "description", "cover_url", "published_year",
    "page_count", "publisher", "status", "finished"];

export async function onRequest(context) {
    const { request, env, params } = context;
    const path = params.path || [];
    const method = request.method;

    try {
        if (!env.DB) return error(500, "Database is not bound to this project (DB).");
        if (!schemaReady) {
            await env.DB.prepare(SCHEMA).run();
            schemaReady = true;
        }

        if (path[0] === "books" && path.length === 1 && method === "GET") {
            return json({ books: await listBooks(env.DB) });
        }

        if (!isAdmin(request, env)) return error(401, "Wrong or missing password.");

        if (path[0] === "auth" && method === "GET") return json({ ok: true });

        if (path[0] === "lookup" && method === "GET") {
            const isbn = normaliseIsbn(new URL(request.url).searchParams.get("isbn"));
            if (!isbn) return error(400, "That doesn't look like a valid ISBN.");
            const existing = await env.DB.prepare("SELECT title FROM books WHERE isbn = ?").bind(isbn).first();
            if (existing) return error(409, `Already on your list: ${existing.title}`);
            return json({ book: await lookupIsbn(isbn, env) });
        }

        if (path[0] === "books" && path.length === 1 && method === "POST") {
            return addBook(env.DB, await request.json());
        }

        if (path[0] === "books" && path.length >= 2) {
            const isbn = normaliseIsbn(path[1]);
            if (!isbn) return error(400, "Invalid ISBN.");
            if (path.length === 2 && method === "PUT") return editBook(env.DB, isbn, await request.json());
            if (path.length === 2 && method === "DELETE") return deleteBook(env.DB, isbn);
            if (path[2] === "move" && method === "POST") {
                const { direction } = await request.json();
                return moveBook(env.DB, isbn, direction);
            }
        }

        return error(404, "Not found.");
    } catch (e) {
        console.error(e);
        return error(500, "Something went wrong: " + e.message);
    }
}


// ====================
// AUTH
// ====================

function isAdmin(request, env) {
    const header = request.headers.get("Authorization") || "";
    const given = header.startsWith("Bearer ") ? header.slice(7) : "";
    const expected = env.ADMIN_PASSWORD || "";
    if (!expected || given.length !== expected.length) return false;
    // Constant-time compare so response timing doesn't leak the password
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
}


// ====================
// BOOK STORAGE
// ====================

async function listBooks(db) {
    const { results } = await db.prepare(
        `SELECT isbn, title, authors, description, cover_url, published_year, page_count,
                publisher, status, finished
         FROM books ORDER BY read_order DESC`
    ).all();
    return results;
}

async function addBook(db, body) {
    const isbn = normaliseIsbn(body.isbn);
    if (!isbn) return error(400, "That doesn't look like a valid ISBN.");

    const book = cleanBook(body);
    if (!book.title) return error(400, "A title is required.");

    const existing = await db.prepare("SELECT title FROM books WHERE isbn = ?").bind(isbn).first();
    if (existing) return error(409, `Already on your list: ${existing.title}`);

    const order = await slotOrder(db, book, null);
    await db.prepare(
        `INSERT INTO books (isbn, ${FIELDS.join(", ")}, read_order)
         VALUES (?, ${FIELDS.map(() => "?").join(", ")}, ?)`
    ).bind(isbn, ...FIELDS.map(f => book[f]), order).run();

    return json({ ok: true, isbn }, 201);
}

async function editBook(db, isbn, body) {
    const current = await db.prepare("SELECT status, finished FROM books WHERE isbn = ?").bind(isbn).first();
    if (!current) return error(404, "Book not found.");

    const book = cleanBook(body);
    if (!book.title) return error(400, "A title is required.");

    // Re-slot the book only when its place in the timeline changed
    let orderSql = "";
    const binds = FIELDS.map(f => book[f]);
    if (book.status !== current.status || book.finished !== current.finished) {
        orderSql = ", read_order = ?";
        binds.push(await slotOrder(db, book, isbn));
    }

    await db.prepare(
        `UPDATE books SET ${FIELDS.map(f => `${f} = ?`).join(", ")}${orderSql} WHERE isbn = ?`
    ).bind(...binds, isbn).run();

    return json({ ok: true });
}

async function deleteBook(db, isbn) {
    const { meta } = await db.prepare("DELETE FROM books WHERE isbn = ?").bind(isbn).run();
    if (!meta.changes) return error(404, "Book not found.");
    return json({ ok: true });
}

// "up" = more recent (towards the top of the page). Swaps with the
// neighbouring book in the same section (read / currently reading).
async function moveBook(db, isbn, direction) {
    const book = await db.prepare("SELECT status, read_order FROM books WHERE isbn = ?").bind(isbn).first();
    if (!book) return error(404, "Book not found.");

    const up = direction === "up";
    const neighbour = await db.prepare(
        `SELECT isbn, read_order FROM books
         WHERE status = ? AND read_order ${up ? ">" : "<"} ?
         ORDER BY read_order ${up ? "ASC" : "DESC"} LIMIT 1`
    ).bind(book.status, book.read_order).first();
    if (!neighbour) return json({ ok: true }); // already at the end

    await db.batch([
        db.prepare("UPDATE books SET read_order = ? WHERE isbn = ?").bind(neighbour.read_order, isbn),
        db.prepare("UPDATE books SET read_order = ? WHERE isbn = ?").bind(book.read_order, neighbour.isbn),
    ]);
    return json({ ok: true });
}

// Picks a read_order for a book. Read books with a finished month slot in
// after every book finished in or before that month; anything else goes
// on top as the most recent. Orders are REALs so a book can be placed
// between two others without renumbering the rest.
async function slotOrder(db, book, excludeIsbn) {
    const { results } = await db.prepare(
        "SELECT finished, read_order FROM books WHERE isbn IS NOT ? ORDER BY read_order ASC"
    ).bind(excludeIsbn).all();

    if (results.length === 0) return 1;
    const top = results[results.length - 1].read_order + 1;
    if (book.status !== "read" || !book.finished) return top;

    let i = -1;
    results.forEach((r, idx) => { if (r.finished && r.finished <= book.finished) i = idx; });
    if (i === -1) return results[0].read_order - 1;
    if (i === results.length - 1) return top;
    return (results[i].read_order + results[i + 1].read_order) / 2;
}

function cleanBook(body) {
    const text = (v, max) => String(v ?? "").trim().slice(0, max);
    const pages = parseInt(body.page_count, 10);
    const status = body.status === "reading" ? "reading" : "read";
    const finished = /^\d{4}-(0[1-9]|1[0-2])$/.test(body.finished || "") ? body.finished : null;
    return {
        title: text(body.title, 300),
        authors: text(body.authors, 300),
        description: text(body.description, 2000),
        cover_url: /^https:\/\//.test(body.cover_url || "") ? text(body.cover_url, 1000) : "",
        published_year: text(body.published_year, 10),
        page_count: Number.isFinite(pages) && pages > 0 ? pages : null,
        publisher: text(body.publisher, 200),
        status,
        finished: status === "read" ? finished : null,
    };
}


// ====================
// ISBN HANDLING
// ====================

// Accepts ISBN-10 or ISBN-13 with or without hyphens/spaces, checks the
// check digit, and returns the ISBN-13 (or null if invalid).
function normaliseIsbn(raw) {
    const s = String(raw || "").replace(/[\s-]/g, "").toUpperCase();

    if (/^\d{9}[\dX]$/.test(s)) {
        let sum = 0;
        for (let i = 0; i < 10; i++) sum += (s[i] === "X" ? 10 : +s[i]) * (10 - i);
        if (sum % 11 !== 0) return null;
        const core = "978" + s.slice(0, 9);
        return core + isbn13Check(core);
    }

    if (/^97[89]\d{10}$/.test(s)) {
        return isbn13Check(s.slice(0, 12)) === s[12] ? s : null;
    }

    return null;
}

function isbn13Check(first12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += +first12[i] * (i % 2 ? 3 : 1);
    return String((10 - (sum % 10)) % 10);
}

// Open Library and Google Books, each filling the other's gaps.
async function lookupIsbn(isbn, env) {
    const [google, openLib, olWork, olCover] = await Promise.all([
        fetchGoogle(isbn, env).catch(() => null),
        fetchOpenLibrary(isbn).catch(() => null),
        fetchOpenLibraryWork(isbn).catch(() => null),
        fetchOpenLibraryCover(isbn).catch(() => ""),
    ]);

    const o = openLib || {};
    const w = olWork || {};

    // Google's exact-ISBN search sometimes comes back empty. Then borrow a
    // description from a plain search, but only from a result with the same
    // title (it may be another edition, so nothing edition-specific).
    let g = google || {};
    if (!google && !w.description && (w.title || o.title)) {
        const match = await fetchGoogleByTitle(isbn, w.title || o.title, env).catch(() => null);
        if (match) g = { description: match.description };
    }
    return {
        isbn,
        title: g.title || w.title || o.title || "",
        authors: g.authors || o.authors || "",
        // Open Library's descriptions read like summaries; Google's are
        // often publisher blurbs ("#1 NEW YORK TIMES BESTSELLER...")
        description: shortDescription(w.description || g.description || ""),
        // Open Library's large covers are sharper than Google's thumbnails
        cover_url: olCover || o.cover_url || g.cover_url || "",
        published_year: g.published_year || o.published_year || "",
        page_count: g.page_count || o.page_count || null,
        publisher: g.publisher || o.publisher || "",
        found: Boolean(google || openLib),
    };
}

async function searchGoogle(query, env) {
    const key = env.GOOGLE_BOOKS_API_KEY ? `&key=${env.GOOGLE_BOOKS_API_KEY}` : "";
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}${key}`);
    if (!res.ok) return [];
    return ((await res.json()).items || []).map(item => item.volumeInfo);
}

async function fetchGoogle(isbn, env) {
    const [v] = await searchGoogle(`isbn:${isbn}`, env);
    return v ? googleBook(v) : null;
}

async function fetchGoogleByTitle(isbn, title, env) {
    const simplify = t => String(t || "").toLowerCase().split(":")[0].replace(/[^a-z0-9]/g, "");
    const wanted = simplify(title);
    const results = await searchGoogle(isbn, env);
    const v = results.find(r => simplify(r.title) === wanted && r.description);
    return v ? googleBook(v) : null;
}

function googleBook(v) {
    const thumb = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || "";
    return {
        title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
        authors: (v.authors || []).join(", "),
        description: v.description || "",
        cover_url: thumb.replace(/^http:/, "https:").replace("&edge=curl", ""),
        published_year: (v.publishedDate || "").slice(0, 4),
        page_count: v.pageCount || null,
        publisher: v.publisher || "",
    };
}

async function fetchOpenLibrary(isbn) {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    if (!res.ok) return null;
    const b = (await res.json())[`ISBN:${isbn}`];
    if (!b) return null;

    return {
        title: b.subtitle ? `${b.title}: ${b.subtitle}` : b.title,
        authors: (b.authors || []).map(a => a.name).join(", "),
        cover_url: b.cover?.large || b.cover?.medium || "",
        published_year: (String(b.publish_date || "").match(/\d{4}/) || [""])[0],
        page_count: b.number_of_pages || null,
        publisher: b.publishers?.[0]?.name || "",
    };
}

// The edition record above has no description; the "work" it belongs to
// usually does, along with a properly capitalised title.
async function fetchOpenLibraryWork(isbn) {
    const edition = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!edition.ok) return null;
    const workKey = (await edition.json()).works?.[0]?.key;
    if (!workKey) return null;

    const res = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!res.ok) return null;
    const work = await res.json();
    const description = typeof work.description === "string" ? work.description : work.description?.value;
    return {
        title: work.subtitle ? `${work.title}: ${work.subtitle}` : work.title,
        // Drop the trailing source notes and links Open Library often appends
        description: (description || "").split(/\r?\n-{3,}|\r?\n\(\[source\]/)[0],
    };
}

// default=false makes Open Library 404 instead of serving a blank image
async function fetchOpenLibraryCover(isbn) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url.replace("?default=false", "") : "";
}

// Strips HTML and keeps the first few sentences (~400 characters).
function shortDescription(raw) {
    const text = raw.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
    if (text.length <= 400) return text;
    const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*/g) || [text];
    let out = "";
    for (const s of sentences) {
        if (out && (out + s).length > 400) break;
        out += s;
    }
    return out.length > 450 ? out.slice(0, 397).trimEnd() + "…" : out.trim();
}


// ====================
// HELPERS
// ====================

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
}

function error(status, message) {
    return json({ error: message }, status);
}
