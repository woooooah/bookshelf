# React za frontend

## Opombe

## Kontekst oz. problem

Frontend je spletna aplikacija z veliko ponavljajocimi se elementi (kartice knjig, seznami, filtri, obrazci) in deli, ki se spreminjajo brez osvezevanja strani (filtri v knjiznici, napredek branja, predlog razporeditve polic). Katero orodje uporabiti za izdelavo vmesnika?

## Obravnavane alternative

- React (z Vite)
- Vue
- Angular
- Navaden JavaScript brez ogrodja

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"React (z Vite)"**

_Ker:_ je najbolj razsirjen, ima najvec dokumentacije in primerov, komponente pa se dobro ujemajo z aplikacijo, kjer se isti elementi pojavljajo na vec straneh. Vue bi bil podobno primeren, a ima manj virov. Angular je za majhen projekt pretezek, brez ogrodja pa bi morali spremembe na strani (npr. ob filtriranju) urejati rocno.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- komponente (npr. kartico knjige) napisemo enkrat in jih uporabimo povsod,
- je na voljo veliko knjiznic, ki jih potrebujemo (React Router, Firebase SDK),
- Vite omogoca hiter zagon in osvezevanje med razvojem.

Odlocitev je **slaba**, ker:

- React sam ne resi cisto vsega, potrebna je uporaba knjiznic kar je potencialno lahko varnostno tveganje(npr. za navigacijo)
