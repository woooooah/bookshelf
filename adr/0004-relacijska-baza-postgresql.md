# Relacijska podatkovna baza PostgreSQL

## Opombe

## Kontekst oz. problem

Podatki aplikacije so mocno povezani: delo ima izdaje, izdaje so v knjiznicah uporabnikov, knjige v knjiznici imajo posoje, uporabnik ima bralne vnose za dela. Veljati morajo tudi pravila, npr. en bralni vnos na delo, ocena med 0 in 5, najvec ena aktivna posoja. Kaksno podatkovno bazo uporabiti?

## Obravnavane alternative

- PostgreSQL (relacijska)
- MySQL (relacijska)
- MongoDB (dokumentna)
- Firebase Firestore (dokumentna, v oblaku)

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"PostgreSQL"**

_Ker:_ relacijska baza naravno opise povezane podatke in sama preverja pravila s tujimi kljuci, unikatnostjo in omejitvami. Filtri, kot je "prebrano/neprebrano", so preprosti stiki tabel. V dokumentni bazi (MongoDB, Firestore) bi morali podatke podvajati ali povezovati rocno v kodi. MySQL bi bil podobno primeren, PostgreSQL pa ima boljso podporo za tipe, kot so `enum` in `numeric`

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- baza sama prepreci napacne podatke,
- so poizvedbe s filtri in povezavami preproste,
- je SQL standard, ki ga pozna vecina razvijalcev.

Odlocitev je **slaba**, ker:

- vsaka sprememba strukture zahteva migracijo,
- je manj prilagodljiva za podatke brez stalne oblike (npr. surovi odgovori Open Library).
