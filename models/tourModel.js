const pool = require('../database');

const fieldMap = {
    id: 'id',
    name: 'name',
    duration: 'duration',
    maxGroupSize: 'max_group_size',
    difficulty: 'difficulty',
    ratingsAverage: 'ratings_average',
    ratingsQuantity: 'ratings_quantity',
    price: 'price',
    summary: 'summary',
    description: 'description',
    imageCover: 'image_cover',
    images: 'images'
  };

exports.fieldMap = fieldMap;

async function readTour(client, id) {
  const result = await client.query('SELECT * FROM tours WHERE id = $1', [id]);
  return result.rows[0];
}

exports.findAll = async (queryObj, sort, fields, limit, skip) => {


  const operatorMap = {
    $gte: '>=',
    $gt: '>',
    $lte: '<=',
    $lt: '<'
  };

  const filters = [];
  const values = [];
  //duration: { gt: '5' },  difficulty: 'easy',  sort: [ 'price', 'duration' ]
  Object.keys(queryObj).forEach(key => {
    const value = queryObj[key];
    const column = fieldMap[key];

    if (!column) return;

    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(operator => {
        if (!operatorMap[operator]) return;

        values.push(value[operator]);
        filters.push(`${column} ${operatorMap[operator]} $${values.length}`);
      });
    } else {
      values.push(value);
      filters.push(`${column} = $${values.length}`);
    }
  });

  // startDates belongs to departures; all other fields belong to tours.
  const requestedFields = fields
    ? fields.split(',').filter(field => field === 'startDates' || fieldMap[field])
    : [];
  const limited = requestedFields.length > 0;
  const columns = requestedFields
    .filter(field => field !== 'startDates')
    .map(field => fieldMap[field]);

  // The ID links departures to tours, even if it is omitted from the response.
  if (limited && !columns.includes('id')) columns.push('id');
  const selectedFields = limited ? columns.join(', ') : '*';
  let query = `SELECT ${selectedFields} FROM tours`;

  if (filters.length > 0) {
    query += ` WHERE ${filters.join(' AND ')}`;
  }

  // Sorting
  if (sort) {
    if (Array.isArray(sort)) {
      sort = sort.join(',');
    }

    const sortBy = sort
      .split(',')
      .map(field => {
        if (field.startsWith('-')) {
          const column = fieldMap[field.slice(1)];
          return column ? `${column} DESC` : null;
        }

        const column = fieldMap[field];
        return column ? `${column} ASC` : null;
      })
      .filter(Boolean)
      .join(', ');

    if (sortBy) {
      query += ` ORDER BY ${sortBy}`;
    } else {
      query += ' ORDER BY id';
    }
  } else {
    query += ' ORDER BY id';
  }

  // 1D) Pagination
  query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, skip);
  const result = await pool.query(query, values);

  return result.rows;
};

exports.getStats = async () => {
  // MongoDB's $match becomes WHERE; $group becomes GROUP BY with aggregates.
  // Cast aggregates to double precision so pg returns JSON numbers, not strings.
  const result = await pool.query(
    `SELECT
       UPPER(difficulty) AS "_id",
       COUNT(*)::double precision AS "numTours",
       COALESCE(SUM(ratings_quantity), 0)::double precision AS "numRatings",
       AVG(ratings_average)::double precision AS "avgRating",
       AVG(price)::double precision AS "avgPrice",
       MIN(price)::double precision AS "minPrice",
       MAX(price)::double precision AS "maxPrice"
     FROM tours
     WHERE ratings_average >= $1
     GROUP BY UPPER(difficulty)
     ORDER BY "avgPrice" ASC`,
    [4.5]
  );

  return result.rows;
};

exports.getById = async (id, client = pool) => readTour(client, id);

exports.create = async (tour, client = pool) => {
  const result = await client.query(
    `INSERT INTO tours (
      name, duration, max_group_size, difficulty,
      ratings_average, ratings_quantity, price,
      summary, description, image_cover, images
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      tour.name,
      tour.duration,
      tour.maxGroupSize,
      tour.difficulty,
      tour.ratingsAverage,
      tour.ratingsQuantity,
      tour.price,
      tour.summary,
      tour.description,
      tour.imageCover,
      JSON.stringify(tour.images || [])
    ]
  );

  return result.rows[0];
};

exports.update = async (id, tour, client = pool) => {
  const existing = await client.query(
    'SELECT id FROM tours WHERE id = $1 FOR UPDATE', [id]
  );
  if (!existing.rows[0]) return undefined;
  const fieldMap = {
    name: 'name',
    duration: 'duration',
    maxGroupSize: 'max_group_size',
    difficulty: 'difficulty',
    ratingsAverage: 'ratings_average',
    ratingsQuantity: 'ratings_quantity',
    price: 'price',
    summary: 'summary',
    description: 'description',
    imageCover: 'image_cover',
    images: 'images'
  };

  const fields = Object.keys(tour);
  if (fields.some(field => !Object.prototype.hasOwnProperty.call(fieldMap, field))) {
    throw new Error('Unknown tour field');
  }

  const setString = fields
    .map((field, index) => `${fieldMap[field]} = $${index + 1}`)
    .join(', ');

  const values = fields.map(field => {
    if (field === 'images') {
      return JSON.stringify(tour[field]);
    }

    return tour[field];
  });

  if (fields.length > 0) {
    await client.query(
      `UPDATE tours SET ${setString} WHERE id = $${fields.length + 1}`,
      [...values, id]
    );
  }
  return readTour(client, id);
};

exports.delete = async id => {
  const result = await pool.query(
    `DELETE
     FROM tours
     WHERE id = $1
     RETURNING *
    `,
    [id]
  );
  return result.rows[0];
};
