const CONFIG = {
    API_KEY: '05902896074695709d7763505bb88b4d',
    BASE: 'https://api.themoviedb.org/3',
    W500: 'https://image.tmdb.org/t/p/w500',
    ORIG: 'https://image.tmdb.org/t/p/original',
    SERVERS: [
    { name: 'VidAPI',    icon: 'fa-bolt',        movie: id=>`https://vidapi.xyz/embed/movie/${id}`, tv:(id,s,e)=>`https://vidapi.xyz/embed/tv/${id}&s=${s}&e=${e}` },
    { name: 'VidSrc',    icon: 'fa-server',      movie: id=>`https://vidsrc.me/embed/movie/${id}`, tv:(id,s,e)=>`https://vidsrc.me/embed/tv/${id}/${s}/${e}` },
    { name: '2Embed',    icon: 'fa-play-circle', movie: id=>`https://www.2embed.cc/embed/${id}`,    tv:(id,s,e)=>`https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
    
    // --- New source ---
    { name: 'vidsrc.buzz', icon: 'fa-film',      movie: id=>`https://vidsrc.buzz/embed/movie/${id}`, tv:(id,s,e)=>`https://vidsrc.buzz/embed/tv/${id}/${s}/${e}` },
    { name: 'VidSrc.to', icon: 'fa-film',        movie: id=>`https://vidsrc.to/embed/movie/${id}`, tv:(id,s,e)=>`https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
    { name: 'SuperEmbed',icon: 'fa-bolt',        movie: id=>`https://multiembed.mov/?video_id=${id}&tmdb=1`, tv:(id,s,e)=>`https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
    { name: 'SmashyStream',icon:'fa-tv',         movie: id=>`https://embed.smashystream.com/playere.php?tmdb=${id}`, tv:(id,s,e)=>`https://embed.smashystream.com/playere.php?tmdb=${id}&s=${s}&e=${e}` },
    { name: 'MovieAPI',  icon: 'fa-video',       movie: id=>`https://movieapi.club/movie/${id}`,   tv:(id,s,e)=>`https://movieapi.club/tv/${id}-${s}-${e}` }
    ],
    PLATFORMS: [
        { id:'',    name:'All',       code:'all',     region:'IN' },
        { id:'8',   name:'Netflix',   code:'netflix', region:'IN', logo:'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
        { id:'119', name:'Prime',     code:'prime',   region:'IN', logo:'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png' },
        { id:'337', name:'Disney+',   code:'disney',  region:'IN', logo:'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
        { id:'350', name:'Apple TV+', code:'apple',   region:'US', logo:'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg', invert:true },
        { id:'531', name:'Max',       code:'max',     region:'US', logo:'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg' },
        { id:'15',  name:'Hulu',      code:'hulu',    region:'US', logo:'https://www.svgrepo.com/download/354004/hulu.svg' },
        { id:'232', name:'ZEE5',      code:'zee5',    region:'IN', color:'#9B30FF' },
        { id:'315', name:'hoichoi',   code:'hoichoi', region:'IN', color:'#E91E63' },
        { id:'611', name:'ULLU',      code:'ullu',    region:'IN', color:'#FF6B00' },
        { id:'300', name:'ALTBalaji', code:'alt',     region:'IN', color:'#FF0055' }
    ],
    MOOD_GENRES: {
        action:'28', comedy:'35', romance:'10749', horror:'27',
        scifi:'878', thriller:'53', animation:'16', documentary:'99', family:'10751'
    }
};

/* ----------------------------------------------------------------
   STATE
---------------------------------------------------------------- */
const State = {
    type: 'movie', page: 1, lang: '', provider: '', region: 'IN',
    query: '', isSearch: false, view: 'grid',
    isWatchlistView: false, isHomeView: true, isBrowseView: false,
    filters: { genres:[], year:null, rating:null },
    activeId: null, activeType: null, activeData: null, activeServer: 0,
    watchlist: JSON.parse(localStorage.getItem('tp_watchlist') || '[]'),
    history: JSON.parse(localStorage.getItem('tp_history') || '[]'),
    searches: JSON.parse(localStorage.getItem('tp_searches') || '[]'),
    continueWatch: JSON.parse(localStorage.getItem('tp_continue') || '[]'),
    infiniteScrollEnabled: true,
    isLoading: false
};

/* ----------------------------------------------------------------
   UTILS
---------------------------------------------------------------- */
const Utils = {
    toast(msg, type='success') {
        const icon = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' }[type];
        document.getElementById('toast-text').textContent = msg;
        document.getElementById('toast-icon').className = `fas ${icon} toast-icon`;
        document.getElementById('toast-inner').className = `toast-inner ${type}`;
        const w = document.getElementById('toast-wrap');
        w.classList.add('show');
        clearTimeout(Utils._toastTimer);
        Utils._toastTimer = setTimeout(()=>w.classList.remove('show'), 2800);
    },
    progress(on) {
        const outer = document.getElementById('progress-bar-outer');
        const bar = document.getElementById('progress-bar-inner');
        if(on) { outer.style.opacity='1'; bar.style.width='30%'; setTimeout(()=>bar.style.width='72%',220); }
        else { bar.style.width='100%'; setTimeout(()=>{ outer.style.opacity='0'; setTimeout(()=>bar.style.width='0%',320); },320); }
    },
    copyLink() { navigator.clipboard.writeText(window.location.href); Utils.toast('Link copied!','info'); },
    share(p) {
        const title = State.activeData ? (State.activeData.title||State.activeData.name) : 'TioPlay';
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Watch "${title}" on TioPlay! `);
        const link = p==='twitter' ? `https://twitter.com/intent/tweet?text=${text}&url=${url}` : `https://api.whatsapp.com/send?text=${text}${url}`;
        window.open(link,'_blank');
    },
    year: d => d ? d.split('-')[0] : 'N/A',
    stars(r) {
        const n = Math.round((r/10)*5);
        return Array.from({length:5},(_,i)=>`<i class="${i<n?'fas':'far'} fa-star ${i<n?'star-filled':'star-empty'}"></i>`).join('');
    },
    runtime(min) { return min ? `${Math.floor(min/60)}h ${min%60}m` : 'N/A'; }
};

/* ----------------------------------------------------------------
   API
---------------------------------------------------------------- */
const API = {
    async fetch(url) {
        try { const r = await fetch(url); return await r.json(); }
        catch(e) { console.error(e); return null; }
    },
    discoverUrl() {
        let u = `${CONFIG.BASE}/discover/${State.type}?api_key=${CONFIG.API_KEY}&sort_by=popularity.desc&page=${State.page}`;
        if(State.lang) u += `&with_original_language=${State.lang}`;
        if(State.provider) u += `&with_watch_providers=${State.provider}&watch_region=${State.region}`;
        if(State.filters.genres.length) u += `&with_genres=${State.filters.genres.join(',')}`;
        if(State.filters.year) u += `&${State.type==='movie'?'primary_release_year':'first_air_date_year'}=${State.filters.year}`;
        if(State.filters.rating) u += `&vote_average.gte=${State.filters.rating}`;
        return u;
    },
    searchUrl: ()=>`${CONFIG.BASE}/search/multi?api_key=${CONFIG.API_KEY}&query=${encodeURIComponent(State.query)}&page=${State.page}`
};

/* ----------------------------------------------------------------
   APP CORE
---------------------------------------------------------------- */
const App = {
    async init() {
        OTTTabs.render();
        NavScroll.init();
        Search.init();
        FilterPanel.initGenres();
        InfiniteScroll.init();
        ContinueWatch.render();
        await Hero.init();
        await HomeRows.init();
        Stats.update();
    },

    goHome() {
        State.isHomeView = true; State.isBrowseView = false; State.isWatchlistView = false;
        State.query = ''; document.getElementById('search-input').value = '';
        document.getElementById('home-rows').style.display = 'block';
        document.getElementById('browse-view').style.display = 'none';
        document.getElementById('hero-wrap').style.display = 'block';
        document.getElementById('ott-tabs').closest('.ott-section').style.display = 'block';
        document.getElementById('stats-bar').style.display = 'flex';
        const cont = document.getElementById('continue-section');
        if(State.continueWatch.length) cont.style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
        document.querySelector('[data-nav="movie"]').classList.add('active');
        State.type = 'movie';
    },

    showBrowse(heading, icon='fa-fire') {
        State.isHomeView = false; State.isBrowseView = true;
        document.getElementById('home-rows').style.display = 'none';
        document.getElementById('browse-view').style.display = 'block';
        document.getElementById('hero-wrap').style.display = 'none';
        document.getElementById('stats-bar').style.display = 'none';
        document.getElementById('continue-section').style.display = 'none';
        document.getElementById('view-heading').innerHTML = `<i class="fas ${icon}"></i> ${heading}`;
        window.scrollTo({top:0, behavior:'smooth'});
    },

    setType(t) {
        State.type = t; State.isSearch = false; State.filters = {genres:[],year:null,rating:null};
        State.lang = ''; State.provider = '';
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===t));
        this.showBrowse(`Trending ${t==='movie'?'Movies':'Shows'}`, t==='movie'?'fa-film':'fa-tv');
        Hero.init();
        this.loadContent(true);
    },

    setLang(l, e) {
        State.lang = l;
        document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
        e.target.classList.add('active');
        this.loadContent(true);
    },

    setView(v) {
        State.view = v;
        document.getElementById('btn-grid-view').classList.toggle('active', v==='grid');
        document.getElementById('btn-list-view').classList.toggle('active', v==='list');
        document.getElementById('media-grid').className = `media-grid ${v==='list'?'list-view':''}`;
    },

    async loadContent(reset=false) {
        if(State.isLoading) return;
        State.isLoading = true;
        if(reset) { State.page=1; GridUI.showSkeletons(); }
        Utils.progress(true);
        const url = State.isSearch ? API.searchUrl() : API.discoverUrl();
        const data = await API.fetch(url);
        if(data) {
            const items = State.isSearch ? data.results.filter(i=>i.media_type==='movie'||i.media_type==='tv') : data.results;
            GridUI.render(items, reset);
            const lma = document.getElementById('load-more-area');
            lma.style.display = (data.page >= data.total_pages || !items.length) ? 'none' : 'block';
        }
        Utils.progress(false);
        State.isLoading = false;
    },

    loadMore() { State.page++; this.loadContent(false); },

    showWatchlist() {
        State.isWatchlistView = true;
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav==='watchlist'));
        this.showBrowse('My List', 'fa-heart');
        document.getElementById('mood-bar').style.display = 'none';
        document.getElementById('load-more-area').style.display = 'none';
        if(!State.watchlist.length) {
            document.getElementById('media-grid').innerHTML = `<div class="empty-state"><div class="empty-icon-wrap"><i class="fas fa-heart-broken"></i></div><div class="empty-title">Your List is Empty</div><div class="empty-subtitle">Add movies &amp; shows you want to watch.</div></div>`;
        } else GridUI.render(State.watchlist, true);
    }
};

/* ----------------------------------------------------------------
   NAV SCROLL BEHAVIOR
---------------------------------------------------------------- */
const NavScroll = {
    init() {
        let last = 0;
        window.addEventListener('scroll', ()=>{
            const y = window.scrollY;
            const nav = document.getElementById('navbar');
            if(y>60) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
            if(y > last+5 && y>200) nav.classList.add('nav-hidden');
            else if(y < last-5) nav.classList.remove('nav-hidden');
            last = y;
        }, {passive:true});
    }
};

/* ----------------------------------------------------------------
   OTT TABS
---------------------------------------------------------------- */
const OTTTabs = {
    render() {
        document.getElementById('ott-tabs').innerHTML = CONFIG.PLATFORMS.map((p,i)=>{
            let inner = p.logo
                ? `<img src="${p.logo}" alt="${p.name}" class="ott-logo${p.invert?' invert':''}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/><span class="ott-text" style="display:none;color:${p.color||'white'}">${p.name}</span>`
                : `<span class="ott-text" style="color:${p.color||'white'}">${p.name}</span>`;
            return `<div class="ott-chip${i===0?' active':''}" onclick="OTTTabs.select('${p.id}','${p.region}',this)">${inner}</div>`;
        }).join('');
    },
    select(id, region, el) {
        State.provider=id; State.region=region; State.isSearch=false;
        document.querySelectorAll('.ott-chip').forEach(c=>c.classList.remove('active'));
        el.classList.add('active');
        const name = el.querySelector('.ott-text')?.textContent || el.querySelector('.ott-logo')?.alt || 'Trending';
        App.showBrowse(id ? name : 'Trending Now', 'fa-bolt');
        App.loadContent(true);
    }
};

/* ----------------------------------------------------------------
   HERO SLIDER
---------------------------------------------------------------- */
const Hero = {
    _timer: null, _idx: 0,
    async init() {
        const data = await API.fetch(`${CONFIG.BASE}/trending/${State.type}/day?api_key=${CONFIG.API_KEY}`);
        if(!data?.results) return;
        const slides = data.results.slice(0,6);
        const track = document.getElementById('hero-track');
        const dots = document.getElementById('hero-dots');
        track.innerHTML = ''; dots.innerHTML = '';
        slides.forEach((item,i)=>{
            const type = item.media_type || State.type;
            const s = document.createElement('div');
            s.className = 'hero-slide';
            s.style.backgroundImage = `url(${CONFIG.ORIG+item.backdrop_path})`;
            const isInWL = State.watchlist.some(w=>w.id===item.id);
            s.innerHTML = `
                <div class="hero-content">
                    <div class="hero-badges">
                        <span class="badge-rank">#${i+1} Trending</span>
                        <span class="badge-type">${type==='movie'?'Movie':'TV Show'}</span>
                        <span class="badge-quality">4K HDR</span>
                    </div>
                    <h2 class="hero-title">${item.title||item.name}</h2>
                    <div class="hero-meta-row">
                        <div class="hero-rating"><div class="hero-stars">${Utils.stars(item.vote_average)}</div> ${item.vote_average.toFixed(1)}</div>
                        <span class="hero-dot-divider"></span>
                        <span>${Utils.year(item.release_date||item.first_air_date)}</span>
                    </div>
                    <p class="hero-desc">${item.overview}</p>
                    <div class="hero-actions">
                        <button class="btn-hero-play" onclick="Modals.openFull(${item.id},'${type}')"><i class="fas fa-play"></i> Stream Now</button>
                        <button class="btn-hero-info" onclick="Modals.openQuick(${item.id},'${type}')"><i class="fas fa-info-circle"></i> More Info</button>
                        <button class="btn-hero-watchlist${isInWL?' in-list':''}" id="hero-wl-${item.id}" onclick="event.stopPropagation();Watchlist.toggleById(${item.id},'${type}','${(item.title||item.name).replace(/'/g,"\\'")}','${item.poster_path}',${item.vote_average.toFixed(1)},'${Utils.year(item.release_date||item.first_air_date)}')">
                            <i class="fas ${isInWL?'fa-check':'fa-plus'}"></i>
                        </button>
                    </div>
                </div>`;
            track.appendChild(s);
            const dot = document.createElement('div');
            dot.className = `hero-dot${i===0?' active':''}`;
            dot.onclick = ()=>{ Hero._idx=i; Hero.update(); };
            dots.appendChild(dot);
        });
        if(slides[2] && document.getElementById('collection-bg')) {
            document.getElementById('collection-bg').style.backgroundImage = `url(${CONFIG.ORIG+slides[2].backdrop_path})`;
        }
        Hero._idx = 0;
        clearInterval(Hero._timer);
        Hero._timer = setInterval(()=>{ Hero._idx=(Hero._idx+1)%slides.length; Hero.update(); }, 7000);
    },
    update() {
        document.getElementById('hero-track').style.transform = `translateX(-${Hero._idx*100}%)`;
        document.querySelectorAll('.hero-dot').forEach((d,i)=>d.classList.toggle('active',i===Hero._idx));
    }
};

/* ----------------------------------------------------------------
   SEARCH
---------------------------------------------------------------- */
const Search = {
    init() {
        const input = document.getElementById('search-input');
        const drop = document.getElementById('search-dropdown');
        let debounce;
        input.addEventListener('input', e=>{
            clearTimeout(debounce);
            const q = e.target.value.trim();
            if(q.length > 2) {
                debounce = setTimeout(async ()=>{
                    const data = await API.fetch(`${CONFIG.BASE}/search/multi?api_key=${CONFIG.API_KEY}&query=${encodeURIComponent(q)}`);
                    if(data?.results) {
                        const items = data.results.filter(i=>i.poster_path).slice(0,6);
                        document.getElementById('sdrop-results').innerHTML = items.map(i=>`
                            <div class="sdrop-item" onclick="Search.commit('${(i.title||i.name).replace(/'/g,"\\'")}')">
                                <img class="sdrop-img" src="${CONFIG.W500+i.poster_path}" alt=""/>
                                <div class="sdrop-info">
                                    <div class="sdrop-title">${i.title||i.name}</div>
                                    <div class="sdrop-meta">
                                        <span class="sdrop-type">${i.media_type||'movie'}</span>
                                        <span><i class="fas fa-star" style="color:#FFD700;font-size:11px"></i> ${i.vote_average?.toFixed(1)||'N/A'}</span>
                                    </div>
                                </div>
                            </div>`).join('');
                        drop.classList.add('active');
                    }
                }, 280);
            } else { drop.classList.remove('active'); }
        });
        input.addEventListener('focus', ()=>{ Search.renderRecent(); drop.classList.add('active'); });
        document.addEventListener('click', e=>{ if(!e.target.closest('.search-wrap')) drop.classList.remove('active'); });
        input.addEventListener('keydown', e=>{ if(e.key==='Enter') Search.execute(); });
        Search.renderRecent();
        Search.initVoice();
    },
    execute() { const q = document.getElementById('search-input').value.trim(); if(q) Search.commit(q); },
    commit(q) {
        State.isSearch=true; State.query=q;
        document.getElementById('search-input').value=q;
        document.getElementById('search-dropdown').classList.remove('active');
        document.getElementById('main-search-wrap').classList.remove('mobile-open');
        State.searches = [q,...State.searches.filter(s=>s!==q)].slice(0,8);
        localStorage.setItem('tp_searches', JSON.stringify(State.searches));
        Search.renderRecent();
        App.showBrowse(`Results for "${q}"`, 'fa-search');
        App.loadContent(true);
    },
    renderRecent() {
        document.getElementById('sdrop-recent').innerHTML = State.searches.map(q=>`<span class="sdrop-pill" onclick="Search.commit('${q.replace(/'/g,"\\'")}')"><i class="fas fa-history"></i> ${q}</span>`).join('');
    },
    initVoice() {
        const btn = document.getElementById('voice-btn');
        const input = document.getElementById('search-input');
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if(!SR) { if(btn) btn.style.display='none'; return; }
        const r = new SR(); r.continuous=false;
        if(btn) {
            btn.addEventListener('click', ()=>{ r.start(); btn.classList.add('recording'); input.placeholder='Listening...'; });
            r.onresult = e=>{ const t=e.results[0][0].transcript; input.value=t; Search.commit(t); };
            r.onend = ()=>{ btn.classList.remove('recording'); input.placeholder='Search movies, shows...'; };
        }
    }
};

/* ----------------------------------------------------------------
   FILTER PANEL
---------------------------------------------------------------- */
const FilterPanel = {
    async initGenres() {
        const [m,t] = await Promise.all([
            API.fetch(`${CONFIG.BASE}/genre/movie/list?api_key=${CONFIG.API_KEY}`),
            API.fetch(`${CONFIG.BASE}/genre/tv/list?api_key=${CONFIG.API_KEY}`)
        ]);
        if(m&&t) {
            const all = [...m.genres,...t.genres];
            const uniq = Array.from(new Set(all.map(a=>a.id))).map(id=>all.find(a=>a.id===id));
            document.getElementById('genre-cloud').innerHTML = uniq.map(g=>`<span class="genre-tag" data-id="${g.id}" onclick="this.classList.toggle('active')">${g.name}</span>`).join('');
        }
    },
    toggle() {
        const p = document.getElementById('filter-panel');
        const btn = document.getElementById('filter-toggle-btn');
        p.classList.toggle('open');
        btn.classList.toggle('active', p.classList.contains('open'));
    },
    apply() {
        State.filters.genres = [...document.querySelectorAll('.genre-tag.active')].map(c=>c.dataset.id);
        State.filters.year = document.getElementById('filter-year').value;
        State.filters.rating = document.getElementById('filter-rating').value;
        State.isSearch = false;
        document.getElementById('filter-panel').classList.remove('open');
        document.getElementById('filter-toggle-btn').classList.remove('active');
        App.loadContent(true);
    },
    reset() {
        document.querySelectorAll('.genre-tag').forEach(c=>c.classList.remove('active'));
        document.getElementById('filter-year').value=2024; document.getElementById('yr-val').textContent='2024';
        document.getElementById('filter-rating').value=5; document.getElementById('rt-val').textContent='5.0';
        State.filters = {genres:[],year:null,rating:null};
    }
};

/* ----------------------------------------------------------------
   MOOD / VIBE FILTER
---------------------------------------------------------------- */
const Mood = {
    set(el, mood) {
        document.querySelectorAll('.mood-chip').forEach(c=>c.classList.remove('active'));
        el.classList.add('active');
        if(mood && CONFIG.MOOD_GENRES[mood]) {
            State.filters.genres = [CONFIG.MOOD_GENRES[mood]];
        } else {
            State.filters.genres = [];
        }
        State.isSearch = false;
        App.loadContent(true);
    }
};

/* ----------------------------------------------------------------
   GRID UI
---------------------------------------------------------------- */
const GridUI = {
    showSkeletons() {
        document.getElementById('media-grid').innerHTML = Array(16).fill(`<div class="card-skel"></div>`).join('');
    },
    render(items, reset) {
        const grid = document.getElementById('media-grid');
        if(reset) grid.innerHTML = '';
        if(!items.length && reset) {
            grid.innerHTML = `<div class="empty-state"><div class="empty-icon-wrap"><i class="fas fa-ghost"></i></div><div class="empty-title">No Results Found</div><div class="empty-subtitle">Try different filters or search terms.</div></div>`;
            return;
        }
        items.forEach((item,idx) => {
            if(!item.poster_path) return;
            const type = item.media_type || State.type;
            const title = item.title || item.name;
            const year = Utils.year(item.release_date || item.first_air_date);
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
            const isWL = State.watchlist.some(w=>w.id===item.id);
            const safeTitle = title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
            const args = `${item.id},'${type}','${safeTitle}','${item.poster_path}',${rating},'${year}'`;
            const isNew = item.release_date && (new Date()-new Date(item.release_date)) < 30*24*60*60*1000;
            const card = document.createElement('div');
            card.className = 'media-card';
            card.innerHTML = `
                <div class="card-img-wrap">
                    <img class="card-img" src="${CONFIG.W500+item.poster_path}" loading="lazy" alt="${safeTitle}"/>
                    ${idx<3 ? `<span class="card-rank">#${idx+1}</span>` : ''}
                    ${isNew ? `<span class="card-new-badge">NEW</span>` : ''}
                    <div class="card-overlay">
                        <div class="card-top-row">
                            <button class="card-wl-btn ${isWL?'in-list':''}" id="cwl-${item.id}" onclick="event.stopPropagation();Watchlist.toggleById(${args})">
                                <i class="fas ${isWL?'fa-check':'fa-heart'}"></i>
                            </button>
                            <span class="card-star"><i class="fas fa-star"></i> ${rating}</span>
                        </div>
                        <div class="card-center">
                            <div class="card-play-btn"><i class="fas fa-play"></i></div>
                        </div>
                        <div class="card-bottom card-bottom-info">
                            <div class="card-title">${title}</div>
                            <div class="card-meta">${year} · ${type.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
                <div class="card-list-info">
                    <div class="card-list-title">${title}</div>
                    <div class="card-list-meta"><span>${year}</span><span style="text-transform:uppercase">${type}</span><span>⭐ ${rating}</span></div>
                    <div class="card-list-desc">${item.overview||''}</div>
                    <div class="card-list-actions">
                        <button class="card-list-btn play" onclick="event.stopPropagation();Modals.openFull(${item.id},'${type}')"><i class="fas fa-play"></i> Watch</button>
                        <button class="card-list-btn info"><i class="fas fa-info-circle"></i> Details</button>
                    </div>
                </div>`;
            card.onclick = ()=>Modals.openQuick(item.id, type);
            grid.appendChild(card);
        });
    }
};

/* ----------------------------------------------------------------
   WATCHLIST
---------------------------------------------------------------- */
const Watchlist = {
    toggleById(id, type, title, poster, rating, year) {
        const idx = State.watchlist.findIndex(w=>w.id===id);
        const cardBtn = document.getElementById(`cwl-${id}`);
        const fvBtn = document.getElementById('fv-wl-btn');
        const qvBtn = document.getElementById('qv-wl-btn');
        const heroBtn = document.getElementById(`hero-wl-${id}`);
        if(idx>-1) {
            State.watchlist.splice(idx,1); Utils.toast('Removed from My List','info');
            if(cardBtn){cardBtn.classList.remove('in-list');cardBtn.innerHTML='<i class="fas fa-heart"></i>';}
            if(fvBtn&&State.activeId===id){fvBtn.classList.remove('in-list');fvBtn.innerHTML='<i class="fas fa-plus"></i>';}
            if(qvBtn&&State.activeId===id){qvBtn.classList.remove('in-list');qvBtn.innerHTML='<i class="fas fa-plus"></i>';}
            if(heroBtn){heroBtn.classList.remove('in-list');heroBtn.innerHTML='<i class="fas fa-plus"></i>';}
        } else {
            State.watchlist.unshift({id,type,title,poster_path:poster,vote_average:parseFloat(rating),year});
            Utils.toast('Added to My List','success');
            if(cardBtn){cardBtn.classList.add('in-list');cardBtn.innerHTML='<i class="fas fa-check"></i>';}
            if(fvBtn&&State.activeId===id){fvBtn.classList.add('in-list');fvBtn.innerHTML='<i class="fas fa-check"></i>';}
            if(qvBtn&&State.activeId===id){qvBtn.classList.add('in-list');qvBtn.innerHTML='<i class="fas fa-check"></i>';}
            if(heroBtn){heroBtn.classList.add('in-list');heroBtn.innerHTML='<i class="fas fa-check"></i>';}
        }
        localStorage.setItem('tp_watchlist', JSON.stringify(State.watchlist));
        if(State.isWatchlistView) App.showWatchlist();
    },
    toggleCurrent() {
        const d = State.activeData; if(!d) return;
        Watchlist.toggleById(d.id, State.activeType, d.title||d.name, d.poster_path, d.vote_average?.toFixed(1), Utils.year(d.release_date||d.first_air_date));
    }
};

/* ----------------------------------------------------------------
   CONTINUE WATCHING
---------------------------------------------------------------- */
const ContinueWatch = {
    add(id, type, title, poster, progress=10) {
        State.continueWatch = State.continueWatch.filter(c=>c.id!==id);
        State.continueWatch.unshift({id,type,title,poster,progress});
        State.continueWatch = State.continueWatch.slice(0,12);
        localStorage.setItem('tp_continue', JSON.stringify(State.continueWatch));
    },
    remove(id) {
        State.continueWatch = State.continueWatch.filter(c=>c.id!==id);
        localStorage.setItem('tp_continue', JSON.stringify(State.continueWatch));
        ContinueWatch.render();
        if(!State.continueWatch.length) document.getElementById('continue-section').style.display='none';
    },
    clearAll() {
        State.continueWatch=[]; localStorage.removeItem('tp_continue');
        document.getElementById('continue-section').style.display='none';
        Utils.toast('Continue watching cleared','info');
    },
    render() {
        if(!State.continueWatch.length) return;
        const row = document.getElementById('continue-row');
        row.innerHTML = State.continueWatch.map(c=>`
            <div class="continue-card" onclick="Modals.openFull(${c.id},'${c.type}')">
                <div class="continue-img-wrap">
                    <img class="continue-img" src="${CONFIG.W500+c.poster}" alt="${c.title}" loading="lazy"/>
                    <div class="continue-overlay"><div class="continue-play"><i class="fas fa-play" style="margin-left:2px"></i></div></div>
                    <button class="continue-remove" onclick="event.stopPropagation();ContinueWatch.remove(${c.id})"><i class="fas fa-times"></i></button>
                </div>
                <div class="continue-progress"><div class="continue-progress-bar" style="width:${c.progress}%"></div></div>
                <div class="continue-info">
                    <div class="continue-title">${c.title}</div>
                    <div class="continue-sub">${c.type==='tv'?'Continue watching':'Continue'} · ${c.progress}% watched</div>
                </div>
            </div>`).join('');
        document.getElementById('continue-section').style.display='block';
    }
};

/* ----------------------------------------------------------------
   HOME CONTENT ROWS
---------------------------------------------------------------- */
const HomeRows = {
    async init() {
        const ids = ['row-new','row-top','row-bengali','row-hindi','row-korean','row-action','row-web'];
        ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=Array(12).fill(`<div class="row-skel"></div>`).join(''); });
        await Promise.all([
            HomeRows.load('row-new',    `${CONFIG.BASE}/movie/now_playing?api_key=${CONFIG.API_KEY}`,                                                         'movie'),
            HomeRows.load('row-top',    `${CONFIG.BASE}/movie/top_rated?api_key=${CONFIG.API_KEY}`,                                                            'movie'),
            HomeRows.load('row-bengali',`${CONFIG.BASE}/discover/movie?api_key=${CONFIG.API_KEY}&with_original_language=bn&sort_by=popularity.desc`,            'movie'),
            HomeRows.load('row-hindi',  `${CONFIG.BASE}/discover/movie?api_key=${CONFIG.API_KEY}&with_original_language=hi&sort_by=popularity.desc`,            'movie'),
            HomeRows.load('row-korean', `${CONFIG.BASE}/discover/tv?api_key=${CONFIG.API_KEY}&with_original_language=ko&sort_by=popularity.desc`,               'tv'),
            HomeRows.load('row-action', `${CONFIG.BASE}/discover/movie?api_key=${CONFIG.API_KEY}&with_genres=28,53&sort_by=popularity.desc`,                    'movie'),
            HomeRows.load('row-web',    `${CONFIG.BASE}/tv/popular?api_key=${CONFIG.API_KEY}`,                                                                  'tv')
        ]);
    },
    async load(rowId, url, type) {
        const el = document.getElementById(rowId); if(!el) return;
        const data = await API.fetch(url);
        if(data?.results) {
            el.innerHTML = data.results.filter(i=>i.poster_path).slice(0,20).map((item,idx)=>{
                const title = item.title||item.name;
                const year = Utils.year(item.release_date||item.first_air_date);
                const safe = title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
                return `<div class="row-card" onclick="Modals.openQuick(${item.id},'${type}')">
                    <div class="row-card-img-wrap">
                        <img src="${CONFIG.W500+item.poster_path}" loading="lazy" alt="${safe}"/>
                        ${idx<3?`<span class="rank-badge">#${idx+1}</span>`:''}
                        <div class="row-card-overlay">
                            <div class="row-card-play"><i class="fas fa-play" style="margin-left:2px"></i></div>
                            <div class="row-card-title">${title}</div>
                            <div class="row-card-meta">${year} · ⭐ ${item.vote_average?.toFixed(1)||'NR'}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    },
    seeAll(key, label) {
        const map = {
            new_releases: ()=>{ State.type='movie'; State.isSearch=false; State.filters={genres:[],year:null,rating:null}; State.lang=''; State.provider=''; },
            top_rated:    ()=>{ State.type='movie'; State.isSearch=false; State.filters={genres:[],year:null,rating:null}; State.lang=''; State.provider=''; },
            bengali:      ()=>{ State.type='movie'; State.lang='bn'; State.isSearch=false; State.provider=''; State.filters={genres:[],year:null,rating:null}; },
            hindi:        ()=>{ State.type='movie'; State.lang='hi'; State.isSearch=false; State.provider=''; State.filters={genres:[],year:null,rating:null}; },
            korean:       ()=>{ State.type='tv';    State.lang='ko'; State.isSearch=false; State.provider=''; State.filters={genres:[],year:null,rating:null}; },
            action:       ()=>{ State.type='movie'; State.filters={genres:['28','53'],year:null,rating:null}; State.isSearch=false; State.provider=''; State.lang=''; },
            webseries:    ()=>{ State.type='tv';    State.lang='';   State.isSearch=false; State.provider=''; State.filters={genres:[],year:null,rating:null}; }
        };
        if(map[key]) map[key]();
        document.querySelectorAll('.mood-chip').forEach(c=>c.classList.remove('active'));
        document.querySelector('[data-mood=""]').classList.add('active');
        App.showBrowse(label, 'fa-th-large');
        App.loadContent(true);
    }
};

/* ----------------------------------------------------------------
   MODALS
---------------------------------------------------------------- */
const Modals = {
    closeAll() {
        document.getElementById('modal-veil').classList.remove('open');
        document.getElementById('qv-box').style.display='none';
        document.getElementById('fv-box').style.display='none';
        document.getElementById('main-player').src='';
        document.body.style.overflow='auto';
    },
    async openQuick(id, type) {
        Utils.progress(true);
        const data = await API.fetch(`${CONFIG.BASE}/${type}/${id}?api_key=${CONFIG.API_KEY}`);
        if(data) {
            document.getElementById('qv-img').src = CONFIG.W500+data.poster_path;
            document.getElementById('qv-title').textContent = data.title||data.name;
            document.getElementById('qv-year').textContent = Utils.year(data.release_date||data.first_air_date);
            document.getElementById('qv-rating').textContent = data.vote_average?.toFixed(1)||'N/A';
            document.getElementById('qv-desc').textContent = data.overview;
            document.getElementById('qv-genres').innerHTML = data.genres?.map(g=>`<span class="qv-genre-tag">${g.name}</span>`).join('')||'';
            const isWL = State.watchlist.some(w=>w.id===id);
            const wlBtn = document.getElementById('qv-wl-btn');
            wlBtn.className = `btn-qv-wl${isWL?' in-list':''}`;
            wlBtn.innerHTML = `<i class="fas ${isWL?'fa-check':'fa-plus'}"></i>`;
            const safe = (data.title||data.name).replace(/'/g,"\\'");
            wlBtn.onclick = ()=>Watchlist.toggleById(id, type, data.title||data.name, data.poster_path, data.vote_average?.toFixed(1), Utils.year(data.release_date||data.first_air_date));
            document.getElementById('qv-play-btn').onclick = ()=>Modals.openFull(id, type);
            document.getElementById('qv-trailer-btn').onclick = ()=>Player.playTrailer(id, type);
            State.activeId = id; State.activeType = type; State.activeData = data;
            document.getElementById('fv-box').style.display='none';
            document.getElementById('qv-box').style.display='flex';
            document.getElementById('modal-veil').classList.add('open');
            document.body.style.overflow='hidden';
        }
        Utils.progress(false);
    },
    async openFull(id, type) {
        Utils.progress(true);
        State.activeId=id; State.activeType=type;
        const data = await API.fetch(`${CONFIG.BASE}/${type}/${id}?api_key=${CONFIG.API_KEY}&append_to_response=credits,similar`);
        if(data) {
            State.activeData=data;
            document.getElementById('fv-poster').src = CONFIG.W500+data.poster_path;
            document.getElementById('fv-title').textContent = data.title||data.name;
            document.getElementById('fv-year').textContent = Utils.year(data.release_date||data.first_air_date);
            document.getElementById('fv-runtime').textContent = type==='movie' ? Utils.runtime(data.runtime) : `${data.number_of_seasons} Season${data.number_of_seasons!==1?'s':''}`;
            document.getElementById('fv-rating').textContent = data.vote_average?.toFixed(1)||'N/A';
            document.getElementById('fv-desc').textContent = data.overview;
            document.getElementById('fv-ambient').style.backgroundImage = `url(${CONFIG.ORIG+data.backdrop_path})`;

            document.getElementById('fv-cast').innerHTML = (data.credits?.cast||[]).slice(0,14).map(c=>`
                <div class="person-card">
                    <img class="person-avatar" src="${c.profile_path?CONFIG.W500+c.profile_path:'https://via.placeholder.com/150x150?text=?'}" alt="${c.name}" loading="lazy"/>
                    <div class="person-name">${c.name}</div>
                    <div class="person-role">${c.character||'Actor'}</div>
                </div>`).join('');

            document.getElementById('fv-related').innerHTML = (data.similar?.results||[]).filter(r=>r.poster_path).slice(0,14).map(r=>`
                <div class="related-card" onclick="Modals.openFull(${r.id},'${type}')">
                    <img src="${CONFIG.W500+r.poster_path}" alt="${r.title||r.name}" loading="lazy"/>
                    <div class="related-title">${r.title||r.name}</div>
                </div>`).join('');

            const isWL = State.watchlist.some(w=>w.id===id);
            const wlBtn = document.getElementById('fv-wl-btn');
            wlBtn.className = `social-btn wl${isWL?' in-list':''}`;
            wlBtn.innerHTML = `<i class="fas ${isWL?'fa-check':'fa-plus'}"></i>`;
            wlBtn.onclick = Watchlist.toggleCurrent;

            FVTabs.show('overview', document.querySelector('[data-tab="overview"]'));

            ContinueWatch.add(id, type, data.title||data.name, data.poster_path, Math.floor(Math.random()*60)+10);
            ContinueWatch.render();

            Player.initControls();
            Player.loadVideo();
            document.getElementById('qv-box').style.display='none';
            document.getElementById('fv-box').style.display='block';
            document.getElementById('modal-veil').classList.add('open');
            document.body.style.overflow='hidden';
        }
        Utils.progress(false);
    }
};

/* ----------------------------------------------------------------
   FULL VIEW TABS
---------------------------------------------------------------- */
const FVTabs = {
    show(tab, el) {
        document.querySelectorAll('.fv-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.fv-tab-pane').forEach(p=>p.classList.remove('active'));
        if(el) el.classList.add('active');
        const pane = document.getElementById(`tab-${tab}`);
        if(pane) pane.classList.add('active');
    }
};

/* ----------------------------------------------------------------
   PLAYER
---------------------------------------------------------------- */
const Player = {
    initControls() {
        document.getElementById('server-tabs').innerHTML = CONFIG.SERVERS.map((s,i)=>`
            <button class="server-tab${i===State.activeServer?' active':''}" onclick="Player.changeServer(${i})">
                <i class="fas ${s.icon}"></i> ${s.name}
            </button>`).join('');
        const ep = document.getElementById('ep-row');
        if(State.activeType==='tv') {
            ep.style.display='flex';
            document.getElementById('btn-ep-go').onclick=()=>Player.loadVideo();
        } else ep.style.display='none';
    },
    changeServer(idx) {
        State.activeServer=idx;
        document.querySelectorAll('.server-tab').forEach((b,i)=>b.classList.toggle('active',i===idx));
        Player.loadVideo();
    },
    loadVideo() {
        const s = CONFIG.SERVERS[State.activeServer];
        let url = State.activeType==='movie'
            ? s.movie(State.activeId)
            : s.tv(State.activeId, document.getElementById('ep-season').value, document.getElementById('ep-episode').value);
        document.getElementById('main-player').src = url;
    },
    async playTrailer(id, type) {
        const data = await API.fetch(`${CONFIG.BASE}/${type}/${id}/videos?api_key=${CONFIG.API_KEY}`);
        if(data?.results) {
            const tr = data.results.find(v=>v.type==='Trailer'&&v.site==='YouTube');
            if(tr) {
                document.getElementById('main-player').src = `https://www.youtube.com/embed/${tr.key}?autoplay=1`;
                document.getElementById('qv-box').style.display='none';
                document.getElementById('fv-box').style.display='block';
                document.getElementById('modal-veil').classList.add('open');
                document.body.style.overflow='hidden';
            } else Utils.toast('Trailer not available','error');
        }
    }
};

/* ----------------------------------------------------------------
   INFINITE SCROLL
---------------------------------------------------------------- */
const InfiniteScroll = {
    init() {
        const observer = new IntersectionObserver(entries=>{
            if(entries[0].isIntersecting && State.isBrowseView && !State.isLoading) {
                App.loadMore();
            }
        }, { rootMargin:'300px' });
        const sentinel = document.createElement('div');
        sentinel.id = 'scroll-sentinel';
        document.getElementById('load-more-area').after(sentinel);
        observer.observe(sentinel);
    }
};

/* ----------------------------------------------------------------
   STATS
---------------------------------------------------------------- */
const Stats = {
    async update() {
        const m = await API.fetch(`${CONFIG.BASE}/discover/movie?api_key=${CONFIG.API_KEY}&page=1`);
        const t = await API.fetch(`${CONFIG.BASE}/discover/tv?api_key=${CONFIG.API_KEY}&page=1`);
        if(m) document.getElementById('stat-movies').textContent = m.total_results > 9999 ? `${(m.total_results/1000).toFixed(0)}K+` : m.total_results;
        if(t) document.getElementById('stat-shows').textContent = t.total_results > 9999 ? `${(t.total_results/1000).toFixed(0)}K+` : t.total_results;
    }
};

/* ----------------------------------------------------------------
   MOBILE BOTTOM NAV
---------------------------------------------------------------- */
const MobNav = {
    go(tab, el) {
        document.querySelectorAll('.bnav-btn').forEach(b=>b.classList.remove('active'));
        el.classList.add('active');
        if(tab==='home') App.goHome();
        else if(tab==='movies') { State.type='movie'; App.showBrowse('Movies','fa-film'); App.loadContent(true); Hero.init(); }
        else if(tab==='tv') { State.type='tv'; App.showBrowse('TV Shows','fa-tv'); App.loadContent(true); Hero.init(); }
        else if(tab==='mylist') App.showWatchlist();
        else if(tab==='search') {
            const sw = document.getElementById('main-search-wrap');
            sw.classList.add('mobile-open');
            setTimeout(()=>document.getElementById('search-input').focus(), 100);
        }
    }
};

/* ----------------------------------------------------------------
   BOOT
---------------------------------------------------------------- */
App.init();
