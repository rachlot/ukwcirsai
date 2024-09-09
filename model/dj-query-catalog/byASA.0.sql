SELECT
  "ASA-Klassifizierung", COUNT("id") AS count
FROM
  "Ereignis"
GROUP BY
  "ASA-Klassifizierung";
