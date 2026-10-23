# Uporabniske zgodbe

## US-01 – Iskanje knjig

- **Funkcionalnost:** 1. Iskanje knjig (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim poiskati knjigo po naslovu, avtorju ali ISBN, da jo lahko hitro najdem in dodam v knjiznico ali med branje.
- **Kriteriji sprejemljivosti:**
    - Iskanje se izvede, ko uporabnik vpise vsaj 4 znake.
    - Sistem najprej pokaze zadetke iz lastnega kataloga; ce jih je manj kot 10, rezultate dopolni z zadetki iz Open Library.
    - Vsak zadetek prikaze naslovnico, naslov, avtorja in serijo (če je knjiga del serije).
    - Ce uporabnik vpise veljaven ISBN (10 ali 13 stevk), sistem prikaze tocno to izdajo.
    - Ce ni zadetkov, se prikaze sporocilo "Ni zadetkov".

## US-02 – Uvoz iz Goodreadsa

- **Funkcionalnost:** 2. Uvoz iz Goodreadsa (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim uvoziti svoj CSV izvoz iz Goodreadsa, da imam vse knjige, ki sem jih prebral ali jih zelim prebrati, vse ocene in datume branja takoj v aplikaciji in mi jih ni treba vnasati rocno.
- **Kriteriji sprejemljivosti:**
    - Sistem sprejme samo datoteko .csv s stolpci Goodreads izvoza; sicer prikaze napako "Datoteka ni Goodreads izvoz".
    - Vsaka knjiga dobi status glede na stolpec Exclusive Shelf: read → prebrano, currently-reading → trenutno berem, to-read → zelim prebrati.
    - Shranijo se tudi ocena (My Rating; vrednost 0 pomeni brez ocene), datum branja (Date Read) in recenzija (My Review).
    - Uvozene knjige se ne dodajo v knjiznico (v lasti); uporabnik jih lahko kasneje rocno oznaci kot "v lasti".
    - Po uvozu se prikaze povzetek, npr. "Uvozenih 112, ze obstojecih 5, neprepoznanih 3"; knjige, ki jih uporabnik ze spremlja, se ne prepisejo, neprepoznane pa so nastete, da jih lahko doda rocno.

## US-03 – Rocni vnos knjige

- **Funkcionalnost:** 3. Rocni vnos knjige
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim rocno dodati knjigo, ki je ni v katalogu, da imam lahko v knjiznici tudi stare ali redke knjige brez ISBN.
- **Kriteriji sprejemljivosti:**
    - Obrazec zahteva naslov in avtorja; ISBN, zalozba, leto, stevilo strani in format so neobvezni.
    - Ce vpisani ISBN v katalogu ze obstaja, sistem ne ustvari nove izdaje, ampak ponudi obstojeco.
    - Nova izdaja dobi status "caka na potrditev" in se takoj prikaze v uporabnikovi knjiznici.
    - Dokler je administrator ne potrdi, je drugi uporabniki pri iskanju ne vidijo.

## US-04 – Dodajanje knjige v knjiznico

- **Funkcionalnost:** 4. Oznacitev knjige kot "v lasti" (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim oznaciti, katero izdajo knjige imam in kje stoji, da vem, kaj imam doma in kje to najdem.
- **Kriteriji sprejemljivosti:**
    - Na strani knjige je seznam izdaj z naslovnico, zalozbo, letom in formatom; uporabnik izbere eno.
    - Uporabnik lahko vpise lokacijo (npr. "dnevna soba, polica 2") in opombe; oboje je neobvezno.
    - Ce ima uporabnik izbrano izdajo ze v knjiznici, sistem prikaze opozorilo "To izdajo ze imas" in doda se en izvod samo po potrditvi.
    - Po shranjevanju se knjiga prikaze v "Moja knjiznica" z oznako formata (tiskana, e-knjiga, zvocna).

## US-05 – Filtriranje in razvrscanje knjiznice

- **Funkcionalnost:** 5. Filtriranje in razvrscanje (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim filtrirati in razvrstiti svojo knjiznico, da hitro najdem dolocene knjige in lazje uredim police.
- **Kriteriji sprejemljivosti:**
    - Na voljo so filtri: format, zanr, knjizna zbirka, serija in prebrano/neprebrano; filtre je mogoce kombinirati.
    - Razvrscanje je mogoce po naslovu in po avtorju, narascajoce ali padajoce.
    - Nad seznamom je prikazano stevilo knjig, ki ustrezajo filtrom (npr. "23 knjig").
    - Filter "neprebrano" prikaze knjige, ki nimajo statusa "prebrano".
    - Gumb "Pocisti filtre" ponastavi vse filtre in razvrscanje.

## US-06 – Evidenca posoj

- **Funkcionalnost:** 6. Evidenca posoj (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim zabeleziti, komu sem posodil knjigo, da ne pozabim, kje je.
- **Kriteriji sprejemljivosti:**
    - Pri knjigi v knjiznici uporabnik vpise ime osebe in datum posoje (privzeto danasnji datum).
    - Knjiga z aktivno posojo ima v knjiznici oznako "Posojeno: [ime]".
    - Knjige ni mogoce znova posoditi, dokler trenutna posoja ni oznacena kot vrnjena.
    - Ob oznaki "vrnjeno" se shrani datum vrnitve, posoja pa ostane v zgodovini knjige.
    - Posoje vidi samo lastnik, tudi ce je profil javen.

## US-07 – Status branja

- **Funkcionalnost:** 7. Status branja (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim knjigi nastaviti status branja, da vidim, kaj sem prebral, kaj berem in kaj zelim prebrati.
- **Kriteriji sprejemljivosti:**
    - Knjiga ima lahko en status: zelim prebrati, trenutno berem ali prebrano.
    - Status je mogoce nastaviti tudi knjigi, ki je uporabnik nima v knjiznici.
    - Ob statusu "trenutno berem" se shrani datum zacetka (privzeto danasnji).
    - Ce knjiga preide iz "trenutno berem" v "prebrano", se kot datum zakljucka shrani danasnji datum (uporabnik ga lahko spremeni, ne sme pa biti v prihodnosti).
    - Ce uporabnik knjigo takoj oznaci kot "prebrano", datum ni obvezen; knjiga je prebrana, vendar se brez datuma ne steje v letni cilj.

## US-08 – Ocena in recenzija

- **Funkcionalnost:** 7. Status branja z oceno in recenzijo (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim prebrano knjigo oceniti in napisati recenzijo, da si zapomnim, kaj mi je bilo vsec.
- **Kriteriji sprejemljivosti:**
    - Oceno in recenzijo je mogoce dodati samo knjigi s statusom "prebrano".
    - Ocena je med 0 in 5 v korakih po 0,25; druge vrednosti sistem zavrne.
    - Recenzija je neobvezna in ima najvec 5000 znakov.
    - Uporabnik ima za eno delo eno oceno, ne glede na stevilo izdaj ali branj; oceno lahko kasneje spremeni ali izbrise.

## US-09 – Napredek branja

- **Funkcionalnost:** 8. Napredek branja
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim beleziti, do katere strani sem prisel, da vidim, koliko knjige mi se ostane.
- **Kriteriji sprejemljivosti:**
    - Napredek je mogoce vpisati samo pri knjigi s statusom "trenutno berem".
    - Uporabnik vpise stran ali odstotek; odstotek se pretvori v stran glede na stevilo strani izdaje.
    - Stran ne sme biti manjsa od 0 ali vecja od stevila strani izdaje.
    - Ko uporabnik vpise zadnjo stran, ga sistem vprasa, ali zeli knjigo oznaciti kot prebrano.

## US-10 – Letni bralni cilj

- **Funkcionalnost:** 9. Letni bralni cilj (MVP)
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim nastaviti, koliko knjig zelim prebrati v letu, da spremljam svoj napredek.
- **Kriteriji sprejemljivosti:**
    - Cilj je celo stevilo vecje od 0; za vsako leto ima uporabnik najvec en cilj, ki ga lahko spremeni.
    - Napredek je prikazan kot "18/30" in z vrstico napredka.
    - V napredek se stejejo vsa branja s statusom "prebrano" in datumom zakljucka v izbranem letu, tudi ponovno prebrane knjige.
    - Ko je cilj dosezen, se prikaze sporocilo "Cilj dosezen".

## US-11 – Javen ali zaseben profil

- **Funkcionalnost:** 10. Javen ali zaseben profil
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim izbrati, ali je moj profil javen, da sam odlocam, kdo vidi mojo knjiznico in branje.
- **Kriteriji sprejemljivosti:**
    - V nastavitvah je stikalo "Javen profil"; nov profil je privzeto zaseben.
    - Pri zasebnem profilu drugi ob obisku profila vidijo samo sporocilo "Profil je zaseben".
    - Pri javnem profilu so vidni knjiznica, branje (tudi knjige s statusom "zelim prebrati"), ocene in recenzije.
    - Lokacije, opombe in posoje niso nikoli vidne drugim.
    - Sprememba nastavitve velja takoj.

## US-12 – Pregled javnega profila

- **Funkcionalnost:** 10. Javen ali zaseben profil
- **Vloga:** obiskovalec
- **Zgodba:** Kot obiskovalec zelim brez prijave pogledati javno knjiznico prijatelja, da mu ne kupim knjige, ki jo ze ima.
- **Kriteriji sprejemljivosti:**
    - Javni profil je dostopen prek povezave `/users/{uporabnisko_ime}` brez prijave.
    - Knjiznica prikaze naslovnico, naslov, avtorja in format vsake knjige; obiskovalec jo lahko isce po naslovu.
    - Obiskovalec ne vidi gumbov za urejanje; vsaka zahteva za spremembo podatkov brez prijave vrne napako 401.
    - Recenzije, ki jih je skril administrator, niso prikazane.

## US-13 – Potrjevanje rocno dodanih knjig

- **Funkcionalnost:** 11. Administracija
- **Vloga:** administrator
- **Zgodba:** Kot administrator zelim pregledati rocno dodane knjige, da so v skupnem katalogu samo pravilni podatki.
- **Kriteriji sprejemljivosti:**
    - Administrator vidi seznam izdaj s statusom "caka na potrditev" z naslovom, avtorjem, ISBN in uporabnikom, ki jo je dodal.
    - Ob potrditvi izdaja dobi status "potrjena" in je vidna vsem pri iskanju.
    - Ob zavrnitvi izdaja ostane samo v knjiznici uporabnika, ki jo je dodal, in se ne prikaze v skupnem katalogu.
    - Stran je dostopna samo vlogi administrator; ostali dobijo napako 403.

## US-14 – Upravljanje uporabnikov

- **Funkcionalnost:** 11. Administracija
- **Vloga:** administrator
- **Zgodba:** Kot administrator zelim blokirati ali izbrisati uporabniski racun, da lahko ukrepam pri zlorabah.
- **Kriteriji sprejemljivosti:**
    - Administrator vidi seznam uporabnikov in ga lahko isce po uporabniskem imenu ali e-posti.
    - Blokiran uporabnik ne more vec uporabljati aplikacije (vsaka zahteva vrne 403), njegov profil pa ni viden drugim.
    - Brisanje racuna zahteva dodatno potrditev in izbrise vse podatke uporabnika.
    - Administrator ne more urejati knjiznice ali branja drugih uporabnikov.

## US-15 – Skrivanje neprimernih recenzij

- **Funkcionalnost:** 11. Administracija
- **Vloga:** administrator
- **Zgodba:** Kot administrator zelim skriti neprimerno recenzijo, da javni profili ne vsebujejo zaljive ali nezelene vsebine.
- **Kriteriji sprejemljivosti:**
    - Pri vsaki javni recenziji ima administrator gumb "Skrij".
    - Skrita recenzija ni vidna drugim uporabnikom in obiskovalcem.
    - Avtor svojo skrito recenzijo se vedno vidi z oznako "Skril administrator".
    - Administrator lahko skrito recenzijo znova prikaze.

## US-16 – Nacrtovalec polic

- **Funkcionalnost:** 12. Nacrtovalec polic
- **Vloga:** registriran uporabnik
- **Zgodba:** Kot registriran uporabnik zelim vnesti mere svojih polic in dobiti predlog razporeditve knjig, da knjige uredim po zanru, avtorju ali naslovu in vem, da bodo pasale.
- **Kriteriji sprejemljivosti:**
    - Uporabnik doda polico z imenom, sirino in visino v centimetrih; sistem jih shrani v milimetrih.
    - Pri tiskani knjigi lahko vpise visino in debelino; ce debelina manjka, jo sistem oceni iz stevila strani.
    - Uporabnik izbere police in kriterij (zanr, avtor ali naslov); sistem predlaga razporeditev, pri kateri vsota debelin knjig ne presega sirine police in nobena knjiga ni visja od police.
    - Knjige, ki ne pasejo na nobeno polico, so prikazane v seznamu "Ni prostora".
    - Ko uporabnik predlog shrani, se vsaki razporejeni knjigi nastavi polica.
