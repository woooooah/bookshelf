# BookShelf

BookShelf je spletna aplikacija za ljubitelje in zbiratelje knjig. Uporabnik v njej spremlja branje (zelim prebrati, trenutno berem, prebrano), ocenjuje knjige in si nastavi letni bralni cilj. Hkrati vodi evidenco domace knjiznice: katere knjige ima, v kaksnem formatu, kje stojijo in komu jih je posodil. Podatke lahko uvozi iz Goodreadsa.

## Tehnologije

- **Frontend:** React (Vite)
- **Backend:** Python (FastAPI)
- **Podatkovna baza:** PostgreSQL (Supabase)
- **Avtentikacija:** Firebase Authentication
- **Podatki o knjigah:** Open Library API

## Dokumentacija

Dokumentacija je v mapi [`docs`](docs/):

- [Zasnova resitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in tehnoloski sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniske zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframes](docs/06-wireframes.md)

## Lokalni zagon

### Predpogoji

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (mora biti zagnan)

### Backend

1. Ustvari datoteko z nastavitvami:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Zazeni backend:
   ```bash
   docker compose up --build
   ```
3. API je dosegljiv na `http://localhost:8000`:
   - `http://localhost:8000/health` – preverjanje delovanja
   - `http://localhost:8000/docs` – samodejna dokumentacija API-ja

Ob spremembi kode v `backend/` se streznik sam ponovno zazene. Ustavis ga s `Ctrl+C` ali `docker compose down`.
