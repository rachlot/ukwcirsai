SELECT
  "Ereignis"."ASA-Klassifizierung", COUNT("Ereignis"."id")
FROM
  "Ereignis"
GROUP BY
   "Ereignis"."ASA-Klassifizierung"
