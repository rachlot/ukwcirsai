SELECT
  "Ereignis"."Versorgungsart", COUNT("Ereignis"."id")
FROM
  "Ereignis"
GROUP BY
   "Ereignis"."Versorgungsart"
