// ====================
// BOOKS PAGE LINK PREVIEWS
// ====================
//
// Serves books.html with Open Graph tags filled in, so a shared link shows
// the book count and the latest cover. Link-preview bots don't run
// JavaScript, which is why this happens on the server.

export async function onRequestGet(context) {
    const { request, env } = context;
    const response = await context.next();

    let count = 0;
    let latest = null;
    try {
        const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM books WHERE status = 'read'").first();
        count = row.n;
        latest = await env.DB.prepare(
            "SELECT title, cover_url FROM books WHERE status = 'read' ORDER BY read_order DESC LIMIT 1"
        ).first();
    } catch (e) {
        // No database yet: fall back to the static tags in books.html
        return response;
    }

    const origin = new URL(request.url).origin;
    const description = count
        ? `${count} book${count === 1 ? "" : "s"} read${latest ? `, most recently ${latest.title}` : ""}.`
        : "Books I've read.";
    const image = latest?.cover_url || `${origin}/Other/avatar.jpg`;

    const setContent = value => ({ element(el) { el.setAttribute("content", value); } });
    return new HTMLRewriter()
        .on('meta[property="og:url"]', setContent(`${origin}/books`))
        .on('meta[property="og:description"]', setContent(description))
        .on('meta[name="description"]', setContent(description))
        .on('meta[property="og:image"]', setContent(image))
        .on('meta[name="twitter:image"]', setContent(image))
        .transform(response);
}
