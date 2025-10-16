# Flash Card Clipper (Study Panel)

**What it does:** highlight on any page → one click to make a flashcard → review due cards in a Chrome side panel with spaced repetition (SM-2 lite). Local-first storage, plus **Export for Anki (TSV)** and **Copy for Quizlet (TSV)**.


## install (dev)

1. `chrome://extensions` → toggle **Developer mode** → **Load unpacked** → select this folder.
2. Pin the extension. Click the icon or press **Ctrl/⌘+Shift+L** to open the **study side panel**.
3. Make a card:
   - select text on any page → right-click → **Save selection as flashcard**, or
   - open the panel and use **Quick add**.


## keyboard shortcuts

- **Ctrl/⌘+Shift+K** → create a card from current selection.
- **Ctrl/⌘+Shift+L** → open study panel.


## exporting

- **Export for Anki** → 
- **Copy for Quizlet** → 


## settings



## architecture



## data model (local)

```json
{
  
}
```





## Project Brief


### Primary User(s)

Learners:

* 1st: Peers in our cohort (futurecode/codesmith) / junior developers
* 2nd: University tech students / self-taught devs / just-in-time learning


### Problem

* Making study materials (copy-pasting)
* Learning from multiple platforms / materials  (tab-goblins)
* Repetitive Googling / context switching


### Solution

Web clipper to flash card chrome extension for learning


### Our Learning Goals

* Understand the foundations of building a Google Chrome Extension
* Create our extension folder using json, .js/.ts, html and potentially .css
* Practice using technical language to communicate functionality
* Practice simplifying jargon + specs for presentions


### MVP Scope (core features)

* Create flashcards from highlighted text or the whole page
* Side panel shows due cards + difficulty rating (spaced-repetition)
* Badge in the toolbar to show due card count
* Store flash cards locally


### Tough Technical Challenges

* Standardize extraction for cards (inconsistent / weird HTML on different platforms/pages)
* Syncing cards + backend
* Usable UI / UX  →  maybe hotkeys ?



### Stretch Goals?

* CSS (for now) → primary
* Typescript (Google Chrome: npm i chrome-types)
* Have an option to delete notes
* Cross-platform / API tie in(s):  Quizlet, Anki, or Notion
* Text-to-speech read out of the cards
* Tags, searching, filtering
* Pomodoro timer / soft focus block (study/learning mode)
* Smart grouping: group by domain or shared keywords
* Stats / streaks
* Translator (might be built in) → can optimize for language learners
* Dark to light mode
* Extended research suggestions: YouTube, Wikipedia, dictionary
* Image cards: generated, from google, or screenshots