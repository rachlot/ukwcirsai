SELECT
  "Ereignis"."Patientenzustand", COUNT("Ereignis"."id")
FROM
  "Ereignis"
GROUP BY
   "Ereignis"."Patientenzustand"