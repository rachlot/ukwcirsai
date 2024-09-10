  create table  "Ereignis" (
  ID serial primary key,
  "Zuständiges Fachgebiet" text,
  "Wo ist das Ereignis passiert" text,
  "Tag des Ereignisses (Wochentag oder Wochende)" text,
  "Versorgungsart (Routinebetrieb oder Notfall)" text,
  "ASA-Klassifizierung" text,
  "Patientenzustand" text,
  "Wichtige Begleitumstände" text,
  "War ein Medizinprodukt beteiligt" text,
  "Welches Medizinprodukt war beteiligt" text, 
  "Was war besonders gut" text,
  "Was war besonders ungünstig" text,
  "Wie häufig tritt ein Ereignis dieser Art auf" text,
 
);
