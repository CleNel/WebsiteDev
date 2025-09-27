// ====================
// THEME TOGGLING
// ====================

const themeButton = document.getElementById("theme-button");

if (themeButton) {
    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        themeButton.textContent = document.body.classList.contains("dark-mode")
            ? "Light Mode"
            : "Dark Mode";
    });
}

// ====================
// PROJECT CARD EXPANSION
// ====================

const cards = document.querySelectorAll(".project-card");
let expandedCard = null;
const originalPositions = new Map();

cards.forEach(card => {
    card.addEventListener("click", (e) => {
        e.stopPropagation();

        if (card.classList.contains("expanded")) {
            collapseCard(card);
            return;
        }

        if (expandedCard) collapseCard(expandedCard);

        expandedCard = card;
        expandCard(card);
    });
});

function expandCard(card) {
    const grid = document.querySelector(".project-grid");

    const pos = originalPositions.get(card) || {};
    pos.nextSibling = card.nextElementSibling;
    pos.parent = card.parentElement;
    originalPositions.set(card, pos);

    grid.insertBefore(card, grid.firstElementChild);
    card.classList.add("expanded");

    const extraContent = document.createElement("div");
    extraContent.classList.add("extra-content");
    card.appendChild(extraContent);

    const projectKey = card.dataset.project;
    if (projectKey) {
        fetch(`projects/${projectKey}.md`)
            .then(res => res.text())
            .then(md => {
                extraContent.innerHTML = marked.parse(md); // Convert Markdown → HTML
            })
            .catch(err => {
                extraContent.innerHTML = "<p>Details coming soon.</p>";
                console.error(err);
            });
    }
}


function collapseCard(card) {
    const pos = originalPositions.get(card);
    if (!pos) return;

    card.classList.remove("expanded");

    const extraContent = card.querySelector(".extra-content");
    if (extraContent) extraContent.remove();

    if (pos.nextSibling) {
        pos.parent.insertBefore(card, pos.nextSibling);
    } else {
        pos.parent.appendChild(card);
    }

    expandedCard = null;

    cards.forEach(c => {
        c.style.pointerEvents = "auto";
        c.style.opacity = "1";
    });
}
