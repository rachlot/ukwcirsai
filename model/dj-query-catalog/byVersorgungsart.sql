SELECT
  "Welche Versorgungsart", COUNT("id") AS count
FROM
  "Ereignis"
GROUP BY
  "Welche Versorgungsart";
