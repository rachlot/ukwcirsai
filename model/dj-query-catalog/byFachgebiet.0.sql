SELECT
  "Ereignis"."Zuständiges Fachgebiet", COUNT("Ereignis"."id")
FROM
  "Ereignis"
GROUP BY
   "Ereignis"."Zuständiges Fachgebiet"