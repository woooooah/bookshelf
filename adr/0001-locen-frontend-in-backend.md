# Locen frontend in backend, ki komunicirata prek REST API-ja

## Opombe

## Kontekst oz. problem

Aplikacija ima uporabniski vmesnik in precej logike, ki se ne sme izvajati samo v brskalniku: klici Open Library in shranjevanje podatkov, uvoz Goodreads CSV, preverjanje, ali je profil javen ali zaseben, in administratorske akcije (potrjevanje knjig, blokiranje uporabnikov). Kako razdeliti aplikacijo na dele in kje naj bo ta logika?

## Obravnavane alternative

- Locen frontend (React) in backend (REST API), ki komunicirata prek HTTP in JSON
- En sam streznik, ki sam izrisuje strani (npr. Django s predlogami)
- Samo frontend, ki neposredno dostopa do baze prek storitve, kot je Supabase ali Firebase (brez lastnega backenda)

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Locen frontend in backend"**

_Ker:_ je to edina moznost, pri kateri je vsa pomembna logika in preverjanje pravic na strezniku, vmesnik pa je se vedno hiter in interaktiven. Brez lastnega backenda bi morala biti logika uvoza in pravila za zasebne profile v brskalniku ali v pravilih baze, kar je tezje testirati in lazje obiti. Streznik, ki izrisuje strani, bi bil preprostejsi za zacetek, vendar bi se ob vsakem filtru ali spremembi napredka osvezila cela stran, vmesnik in logika pa bi bila tesno povezana.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- je delitev jasna: frontend skrbi za prikaz, backend za podatke, logiko in pravice,
- lahko API testiramo sam, brez vmesnika (Thunder Client, samodejna dokumentacija FastAPI)

Odlocitev je **slaba**, ker: {opis}

- moramo zagnati in nastaviti dva projekta, vsakega s svojimi odvisnostmi in `.env` datoteko,
- je treba nastaviti CORS in z vsako zahtevo posiljati zeton za prijavo,
- se nekatera pravila (npr. obvezna polja, ocena 0–5) preverjajo dvakrat: v vmesniku za uporabnika in na backendu za varnost.
