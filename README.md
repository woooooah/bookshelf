# BookShelf

BookShelf je spletna aplikacija za ljubitelje in zbiratelje knjig. Uporabnik v njej spremlja branje (zelim prebrati, trenutno berem, prebrano), ocenjuje knjige in si nastavi letni bralni cilj. Hkrati vodi evidenco domace knjiznice: katere knjige ima, v kaksnem formatu, kje stojijo in komu jih je posodil. Podatke lahko uvozi iz Goodreadsa.

## Tehnologije

- **Frontend:** React (Vite), React Router, Tailwind CSS
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
- [Supabase](https://supabase.com/) projekt

### Podatkovna baza

V Supabase klikni **Connect** in kopiraj niz za **Session pooler** (Direct connection deluje samo prek IPv6). Tabel ni treba ustvarjati rocno, ustvari jih Alembic ob zagonu backenda.

### Zagon aplikacije

1. Ustvari datoteko z nastavitvami backenda in v `DATABASE_URL` prilepi niz iz Supabase (z vpisanim geslom):
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Zazeni backend in frontend:
   ```bash
   docker compose up --build
   ```
3. Aplikacija je dosegljiva na:
   - `http://localhost:5173` – frontend (na zacetni strani je izpisano, ali backend in baza delujeta)
   - `http://localhost:8000/docs` – samodejna dokumentacija API-ja
   - `http://localhost:8000/health/db` – preverjanje povezave z bazo

Ob spremembi kode v `backend/` ali `frontend/` se aplikacija sama osvezi. Ustavis jo s `Ctrl+C` ali `docker compose down`.

Frontend privzeto klice backend na `http://localhost:8000`. Ce je backend drugje, kopiraj `frontend/.env.example` v `frontend/.env.local` in spremeni `VITE_API_URL`.

Nov npm paket dodas z `docker compose exec frontend npm install <paket>`; ob naslednjem zagonu ga container namesti sam.

### Migracije baze (Alembic)

Ob vsakem zagonu backenda se samodejno izvede `alembic upgrade head`, ki v bazi izvede manjkajoce migracije.

Ko spremenis modele v `backend/app/models.py`, ustvari novo migracijo:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "opis spremembe"
```

Ustvarjeno datoteko v `backend/alembic/versions/` preglej (spremembe `CHECK` omejitev je treba dopisati rocno) in jo dodaj v git. Ostali ukazi:

```bash
docker compose run --rm backend alembic current     # trenutna verzija baze
docker compose run --rm backend alembic downgrade -1  # razveljavi zadnjo migracijo
```
