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
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load project details: ${res.status} ${res.statusText}`);
                return res.text();
            })
            .then(md => {
                if (typeof marked === "undefined") throw new Error("Markdown renderer not loaded");
                extraContent.innerHTML = marked.parse(md); // Convert Markdown → HTML
            })
            .catch(err => {
                extraContent.innerHTML = "<p>Could not load details.</p>";
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

}

// ====================
// PHOTO SLIDESHOW
// ====================

(function () {
    const container = document.querySelector('.about-photos');
    if (!container) return;

    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return;

    const dotsEl = container.querySelector('.photo-dots');
    const prevBtn = container.querySelector('.photo-prev');
    const nextBtn = container.querySelector('.photo-next');
    let current = 0;
    let timer = null;
    const INTERVAL = 4000;

    // Activate first image and build dots
    imgs[0].classList.add('active');
    imgs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
        dot.addEventListener('click', () => { goTo(i); resetTimer(); });
        dotsEl.appendChild(dot);
    });

    function goTo(index) {
        imgs[current].classList.remove('active');
        dotsEl.children[current].classList.remove('active');
        current = (index + imgs.length) % imgs.length;
        imgs[current].classList.add('active');
        dotsEl.children[current].classList.add('active');
    }

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), INTERVAL);
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', resetTimer);


    // Touch swipe support
    let touchStartX = 0;
    container.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    container.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
            dx < 0 ? goTo(current + 1) : goTo(current - 1);
            resetTimer();
        }
    }, { passive: true });
    resetTimer();
}());
