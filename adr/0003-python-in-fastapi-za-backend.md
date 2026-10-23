# Python in FastAPI za backend

## Opombe

## Kontekst oz. problem

Backend je REST API (glej ADR-0001), ki mora klicati Open Library, razclenjevati Goodreads CSV, preverjati pravice uporabnikov in delati z bazo. V katerem jeziku in ogrodju ga napisati?

## Obravnavane alternative

- Python in FastAPI
- Node.js in Express
- Java in Spring Boot

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Python in FastAPI"**

_Ker:_ je Python preprost za branje in ima dobre knjiznice za CSV in HTTP klice, kar je jedro uvoza in iskanja. FastAPI je lahek, sam preveri vhodne podatke in samodejno ustvari dokumentacijo API-ja. Express bi pomenil en jezik povsod, ampak ima manj vgrajenega preverjanja podatkov. Spring Boot je za ta projekt pretezek.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- je manj kode za preverjanje podatkov (Pydantic),
- je dokumentacija API-ja na voljo samodejno na `/docs`,
- se klici Open Library lahko izvajajo asinhrono, zato ne blokirajo drugih zahtev.

Odlocitev je **slaba**, ker:

- v projektu uporabljamo dva jezika (JavaScript in Python),
- FastAPI nima vgrajenega dela z bazo, zato potrebujemo se SQLAlchemy in Alembic.
