  create table  "Ereignis" (
  ID serial primary key,
  "Berichtszeitpunkt" TIMESTAMP DEFAULT NOW(),
  "Zuständiges Fachgebiet" text,
  "Wo ist das Ereignis passiert" text,
  "Tag des Ereignisses" text,
  "Versorgungsart" text,
  "ASA-Klassifizierung"  text,
  "Patientenzustand"  text,
  "Wichtige Begleitumstände" text,
  "War ein Medizinprodukt beteiligt" text,
  "Welches Medizinprodukt war beteiligt" text,
  "Fallbeschreibung" text,
  "Was war besonders gut" text,
  "Was war besonders ungünstig" text,
  "Wie häufig tritt ein Ereignis dieser Art auf" text,
  "Rolle des Berichtenden" text
);
  
