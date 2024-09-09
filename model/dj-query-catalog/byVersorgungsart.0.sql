SELECT
  "Ereignis"."Welche Versorgungsart", COUNT("Ereignis"."id")
FROM
  "Ereignis"
GROUP BY
  "Ereignis"."Welche Versorgungsart";
