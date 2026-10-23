# Locitev dela in izdaje v podatkovnem modelu

## Opombe

## Kontekst oz. problem

Kako ucinkovito in uporabno beleziti oziroma shranjevanje knjig, da bo smiselno glede na to da ena knjiga lahko pride v vec izdajah, izdaje pa so pomembne za belezenje domace knjiznice?

## Obravnavane alternative

- Ena tabela `Book`, kjer je vsaka izdaja svoja knjiga
- Ena tabela `Book` z enim zapisom na naslov, izdaje se ne locijo
- Dve tabeli: `Work` (delo) in `Edition` (izdaja)

## Sprejeta odlocitev in utemeljitev

_Izbrana odlocitev:_ **"Dve tabeli: Work in Edition"**

_Ker:_ se branje, ocena in recenzija vezejo na delo, lastnistvo pa na izdajo. Tako ima uporabnik lahko vec izdaj iste knjige in se vedno en status branja. Enako strukturo uporablja Open Library (works in editions), zato podatke lahko prevzamemo brez preoblikovanja. Ce bi bila vsaka izdaja svoja knjiga, bi imel uporabnik za isto knjigo vec statusov in ocen. Ce izdaj ne bi locili, ne bi mogli shraniti formata, ISBN in stevila strani posamezne izdaje.

## Posledice odlocitve

Odlocitev je **dobra**, ker:

- ima uporabnik eno oceno in en status za knjigo, ne glede na stevilo izdaj,
- format, ISBN in stevilo strani pripadajo pravi izdaji,
- se model ujema z Open Library.

Odlocitev je **slaba**, ker:

- so poizvedbe zapletenejse (vec stikov tabel),
- mora uporabnik ob dodajanju v knjiznico izbrati se izdajo, kar je en korak vec,
- mora rocni vnos ustvariti tako delo kot izdajo.
