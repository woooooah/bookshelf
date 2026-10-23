# Open Library API kot vir podatkov o knjigah

## Opombe

## Kontekst oz. problem

za prikaz knjig potrebujemo zunanji vir podatkov o knjigah (naslov, avtor, izdaje, stevilo strani, ISBN, naslovnica). Popolne in brezplacne baze vseh knjig ni nikjer; placljive storitve imajo vec podatkov, a tudi te niso popolne, posebej za slovenske in starejse knjige. Kateri vir podatkov o knjigah uporabiti?

## Obravnavane alternative

- Open Library API
- Google Books API
- ISBNdb (placljiv API)
- Brez zunanjega vira, samo rocni vnos

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Open Library API"**

_Ker:_ je brezplacen, ne potrebuje kljuca in loci dela in izdaje, kar se ujema z nasim modelom (ADR-0008). Ponuja tudi naslovnice prek Covers API. Google Books je bil pri testiranju nezanesljiv: brez kljuca je vracal napako zaradi porabljene kvote, pri znanih ISBN ni nasel knjige, obcasno pa je vrnil napako 503. ISBNdb je placljiv, samo rocni vnos pa bi bil za uporabnika prezamuden. Knjige, ki jih Open Library nima, uporabnik doda rocno (US-03), izbrane knjige pa shranimo v naso bazo.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- je brezplacen in ne potrebuje registracije ali kljuca,
- struktura del in izdaj ustreza nasemu podatkovnemu modelu,
- so naslovnice na voljo prek preprostega URL-ja z ISBN.

Odlocitev je **slaba**, ker:

- nima vseh knjig (posebej slovenskih in starejsih), zato potrebujemo rocni vnos in potrjevanje administratorja,
- so podatki nedosledni (npr. zanri so neurejene oznake, format pogosto manjka),
- je lahko pocasen ali zacasno nedosegljiv, ker ga vzdrzuje neprofitna organizacija.
