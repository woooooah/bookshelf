# Funkcionalnosti in obseg

## Uporabniske vloge

1. Obiskovalec (neprijavljen)
   Lahko:
    - isce po katalogu knjig,
    - pregleduje javne profile in recenzije

    Ne more:
    - dodajati knjig,
    - oznacevati branja,
    - videti zasebnih profilov

2. Registriran uporabnik
   Lahko:
    - upravlja svojo knjiznico in podatke o branju
    - uvaza podatke iz Goodreadsa
    - belezi posoje,
    - nastavi letni bralni cilj,
    - nastavi javnost/zasebnost svojega profila
    - pregleduje profile drugih,
    - pise ocene, recenzije
    - rocno doda knjigo, ki je ni v katalogu

    Ne more:
    - videti zasebnih profilov drugih uporabnikov,
    - urejati podatkov drugih uporabnikov,
    - neposredno urejati skupnega kataloga knjig (rocno dodane knjige potrdi administrator)

3. Administrator
   Lahko:
    - upravlja uporabnike (blokiranje, brisanje racunov),
    - potrjuje rocno dodane knjige,
    - skrije neprimerne recenzije ali profile

    Ne more:
    - urejati knjiznic in podatkov o branju posameznih uporabnikov,
    - videti zasebnih podatkov uporabnikov (posoje, lokacije, opombe)

## Predvidene funkcionalnosti

### Dodajanje knjig

1.  **[MVP]** Iskanje knjig po naslovu, avtorju ali ISBN. Aplikacija najprej isce v svojem katalogu, nato v Open Library API. Izbrana knjiga se shrani v katalog aplikacije.
2.  **[MVP]** Uvoz iz Goodreadsa (CSV izvoz): razclenitev datoteke, ciscenje ISBN, predogled (prepoznane knjige, tezavne vrstice, duplikati). Prenesejo se tudi statusi branja, datumi in ocene.
3.  Rocni vnos knjige, ki je API ne najde. Knjiga caka na potrditev administratorja

### Moja knjiznica

4. **[MVP]** Oznacitev knjige kot "v lasti" z izbiro izdaje, lokacijo shranjevanja
5. **[MVP]** Filtriranje in razvrscanje knjiznice: po formatu, zanru, knjizni zbirki, seriji, prebrano/neprebrano ter po naslovu ali avtorju.
6. **[MVP]** Evidenca posoj: komu in kdaj je bila knjiga posojena
7. Nacrtovalec polic: vnos dimenzij polic in predlog razporeditve knjig glede na njihovo velikost

### Branje

8.  **[MVP]** Status branja (zelim prebrati / trenutno berem / prebrano) z datumom zakljucka, oceno 0–5 in recenzijo.
9.  napredek branja (koliko strani/% je prebranih)
10. **[MVP]** Letni bralni cilj s prikazom napredka (npr. "18/30").

### Profil in administracija

11. Javen ali zaseben profil: ce je profil javen, lahko drugi uporabniki in neprijavljeni obiskovalci vidijo uporabnikovo knjiznico, branje, ocene in recenzije
12. Administracija: potrjevanje rocno dodanih knjig, upravljanje uporabnikov (blokiranje, brisanje racunov) in skrivanje neprimernih recenzij.

## Kasnejse nadgradnje

- skeniranje crtne kode (ISBN) s kamero telefona
- nacrtovalec polic: vnos dimenzij polic in predlog razporeditve knjig glede na njihovo velikost
- razvrscanje po Deweyjevi decimalni klasifikaciji
- izvoz knjiznice v CSV
- mobilna razlicica (PWA)
- vsebinski ali personalizirani bralni izzivi
- statistika branja in knjiznih polic

## Out of scope

- nakup in prodaja knjig ter primerjava cen v spletnih knjigarnah
- druzbeno omrezje (sledenje uporabnikom, novice, komentarji)
- posojanje z racuni izposojevalcev (aplikacija posoje samo belezi)
- hramba ali branje datotek e-knjig in zvocnih knjig
- priporocanje knjig
- uvoz tujih ocen in recenzij z Goodreadsa (mogoc je le uvoz lastnih podatkov iz CSV)
- nativna mobilna aplikacija
