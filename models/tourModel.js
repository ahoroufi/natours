const pool = require('../database');

exports.find = async queryObj => {
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
  images: 'images',
  startDates: 'start_dates'
};

const operatorMap = {
  $gte: '>=',
  $gt: '>',
  $lte: '<=',
  $lt: '<'
};

  const filters = [];
  const values = [];

  Object.keys(queryObj).forEach(key => {
    const value = queryObj[key];
    const column = fieldMap[key];

    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(operator => {
        values.push(value[operator]);
        filters.push(`${column} ${operatorMap[operator]} $${values.length}`);
      });
    } else {
      values.push(value);
      filters.push(`${column} = $${values.length}`);
    }
  });

  let query = 'SELECT * FROM tours';

  if (filters.length > 0) {
    query += ` WHERE ${filters.join(' AND ')}`;
  }

  query += ' ORDER BY id';
  const result = await pool.query(query, values);

  return result.rows;
};

exports.getById = async id => {
  const result = await pool.query(
    `SELECT *
     FROM tours 
     WHERE id = $1`, 
     [id]);
  return result.rows[0];
};

exports.create = async tour => {
  const result = await pool.query(
    `INSERT INTO tours (
      name, duration, max_group_size, difficulty,
      ratings_average, ratings_quantity, price,
      summary, description, image_cover, images, start_dates
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      JSON.stringify(tour.images || []),
      JSON.stringify(tour.startDates || [])
    ]
  );

  return result.rows[0];
};

exports.update = async (id, tour) => {
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
    images: 'images',
    startDates: 'start_dates'
  };

  const fields = Object.keys(tour);

  const setString = fields
    .map((field, index) => `${fieldMap[field]} = $${index + 1}`)
    .join(', ');

  const values = fields.map(field => {
    if (field === 'images' || field === 'startDates') {
      return JSON.stringify(tour[field]);
    }

    return tour[field];
  });

  const result = await pool.query(
    `UPDATE tours
     SET ${setString}
     WHERE id = $${fields.length + 1}
     RETURNING *
     `,
    [...values, id]
  );

  return result.rows[0];
};

exports.delete = async id => {
  const result = await pool.query(
    `DELETE
     FROM tours
     WHERE id = $1
     RETURNING *
    `, [id]);
  return result.rows[0];
};