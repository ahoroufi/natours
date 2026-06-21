require('dotenv').config({ path: './config.env' });

const fs = require('fs');
const pool = require('./database');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
);

async function importTours() {
  try {
    for (const tour of tours) {
      await pool.query(
        `INSERT INTO tours (
          id, name, duration, max_group_size, difficulty,
          ratings_average, ratings_quantity, price,
          summary, description, image_cover, images, start_dates
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          tour.id,
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
          JSON.stringify(tour.images),
          JSON.stringify(tour.startDates)
        ]
      );
    }

    console.log('Tours imported successfully');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

importTours();