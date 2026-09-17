const pool = require('../database');

exports.findByTourIds = async (ids, client = pool) => {
  if (ids.length === 0) return [];
  const result = await client.query(
    `SELECT tour_id, start_date FROM tour_departures
     WHERE tour_id = ANY($1)
     ORDER BY start_date, id`,
    [ids]
  );
  return result.rows;
};

exports.findByTourId = async (id, client = pool) =>
  exports.findByTourIds([id], client);

// The caller supplies the transaction shared with the tour update.
exports.replaceByTourId = async (id, dates, client) => {
  if (!Array.isArray(dates)) throw new Error('startDates must be an array');
  await client.query('DELETE FROM tour_departures WHERE tour_id = $1', [id]);
  for (const date of dates) {
    await client.query(
      'INSERT INTO tour_departures (tour_id, start_date) VALUES ($1, $2)',
      [id, date]
    );
  }
};

exports.getMonthlyPlan = async year => {
  // Each departure is already a row, so no JSON expansion is needed.
  const result = await pool.query(
    `SELECT
       EXTRACT(MONTH FROM departure.start_date AT TIME ZONE 'UTC')::integer AS month,
       COUNT(*)::double precision AS "numTourStarts",
       JSON_AGG(tours.name ORDER BY departure.start_date, tours.id) AS tours
     FROM tour_departures AS departure
     JOIN tours ON tours.id = departure.tour_id
     WHERE departure.start_date >= make_date($1::integer, 1, 1)::timestamp AT TIME ZONE 'UTC'
       AND departure.start_date < make_date($1::integer + 1, 1, 1)::timestamp AT TIME ZONE 'UTC'
     GROUP BY month
     ORDER BY "numTourStarts" DESC, month ASC
     LIMIT 12`,
    [year]
  );

  return result.rows;
};
