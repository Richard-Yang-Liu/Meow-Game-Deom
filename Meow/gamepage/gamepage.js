const games = [
  {
    name: "Tetris",
    desc: "Classic Tetris",
    image: "images/Tetris.png",
    url: "Tetris/Tetris.html"
  },
  {
    name: "Meow Jump",
    desc: "Meow Jump Platform",
    image: "images/Jump.png",
    url: "Meow Jump/meowjump.html"
  },
  // ...more
  {
    name: "TOpoint",
    desc: "A Simple Point Game",
    image: "images/TOpoint.png",
    url: "TOpoint/topoint.html"
  }
];

const gamesPerPage = 2;
let currentPage = 1;

function renderGameCards(page = 1) {
  const container = document.querySelector('.photo-stack-list');
  container.innerHTML = '';
  const start = (page - 1) * gamesPerPage;
  const end = start + gamesPerPage;
  games.slice(start, end).forEach(game => {
    container.innerHTML += `
      <div class="stack game-photo-card" onclick="window.location.href='${game.url}'">
        <div class="card">
          <div class="image" style="background-image: url('${game.image}');"></div>
          <div class="game-name-under">${game.name}<br><span>${game.desc}</span></div>
        </div>
      </div>
    `;
  });
}

function renderPagination() {
  const totalPages = Math.ceil(games.length / gamesPerPage);
  const bar = document.getElementById('pagination-bar');
  bar.innerHTML = ''; // 清空原有内容

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = 'arrow-btn';
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 12l6-6v12z"/></svg>`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => gotoPage(currentPage - 1);
  bar.appendChild(prevBtn);

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => gotoPage(i);
    bar.appendChild(btn);
  }

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'arrow-btn';
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15 12l-6 6V6z"/></svg>`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => gotoPage(currentPage + 1);
  bar.appendChild(nextBtn);

  // Home
  const homeBtn = document.createElement('button');
  homeBtn.className = 'page-btn home-btn';
  homeBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;margin-right:7px;vertical-align:-4px"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home`;
  homeBtn.onclick = () => window.location.href='../homepage.html';
  bar.appendChild(homeBtn);
}



function gotoPage(page) {
  currentPage = page;
  renderGameCards(page);
  renderPagination();
}

document.addEventListener("DOMContentLoaded", function() {
  renderGameCards();
  renderPagination();
});
