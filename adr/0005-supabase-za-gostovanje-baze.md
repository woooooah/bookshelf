# Supabase za gostovanje baze PostgreSQL

## Opombe

## Kontekst oz. problem

Za PostgreSQL (ADR-0004) moramo nekje vzpostaviti bazo, do katere bo dostopal backend med razvojem in kasneje v delujoci aplikaciji.

## Obravnavane alternative

- Supabase (gostovan PostgreSQL)
- Lasten PostgreSQL lokalno ali na lastnem strezniku (npr. v Dockerju)
- Druge storitve v oblaku (npr. Neon, Railway, AWS RDS)

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Supabase"**

_Ker:_ ne zelimo skrbeti za namestitev, varnostne kopije in vzdrzevanje streznika, projekt pa mora biti brezplacen. Supabase ponuja brezplacen gostovan PostgreSQL s spletnim vmesnikom za pregled tabel in SQL urejevalnikom, zato ni treba postavljati streznika. Pod njim je navaden PostgreSQL, zato se lahko kadarkoli preselimo drugam brez sprememb kode. Lasten streznik pomeni vec dela z namestitvijo in vzdrzevanjem, AWS RDS je placljiv, druge brezplacne storitve pa so podobne, a z manj dokumentacije.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- ni treba namescati in vzdrzevati streznika za bazo,
- lahko tabele in podatke pregledujemo v brskalniku,
- je baza dosegljiva od koderkoli, ne samo z enega racunalnika.

Odlocitev je **slaba**, ker:

- ima brezplacna razlicica omejitve (velikost baze, neaktiven projekt se lahko zacasno ustavi),
- smo odvisni od zunanje storitve in internetne povezave.
