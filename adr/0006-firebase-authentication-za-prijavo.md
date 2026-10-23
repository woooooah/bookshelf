# Firebase Authentication za prijavo uporabnikov

## Opombe

## Kontekst oz. problem

Uporabniki se morajo registrirati in prijaviti, backend pa mora pri vsaki zahtevi vedeti, kdo jo je poslal. Shranjevanje gesel in vodenje sej mora biti varno

## Obravnavane alternative

- Lastna prijava v FastAPI (zgoscena gesla in JWT zetoni)
- Supabase Auth
- Firebase Authentication
- Auth0

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Firebase Authentication"**

_Ker:_ so registracija, prijava, ponastavitev gesla in prijava z Google racunom ze reseni, frontend pa jih uporabi z nekaj vrsticami kode. Backend zeton preveri s knjiznico `firebase-admin`, vloge pa hrani nasa baza. Z lastno prijavo je bistveno vec tveganja, prav tko pa je bistveno vecje tveganje sama varnost, gesla mores shranjevati, zgoscevati, poskrbeti moras da je zares varno.
Auth0 je zapletenejsi za nastavitev, Supabase Auth bi bil tudi primeren, a bi prijavo vezal na ponudnika baze.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- aplikacija sama ne hrani gesel,
- je prijava z Google racunom na voljo brez dodatnega dela,
- prijava ni vezana na izbiro baze.

Odlocitev je **slaba**, ker:

- uporabljamo dve zunanji storitvi (Firebase in Supabase),
- moramo ob prvi prijavi ustvariti uporabnika se v nasi bazi in skrbeti, da se ujemata (Firebase UID),
- smo odvisni od Googlove storitve.
