const Tour = require('../models/tourModel');
const Departure = require('../models/departureModel');
const pool = require('../database');
const APIFeatures = require('../utils/apiFeatures');

// Assemble the API response after each model has read its own table.
async function addStartDates(tours, client) {
  const departures = await Departure.findByTourIds(tours.map(tour => tour.id), client);
  const datesByTour = new Map(tours.map(tour => [tour.id, []]));
  departures.forEach(departure => {
    datesByTour.get(departure.tour_id).push(departure.start_date.toISOString());
  });
  tours.forEach(tour => {
    delete tour.start_dates;
    tour.startDates = datesByTour.get(tour.id);
  });
}

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  //api/v1/tours?duration[gt]=5&difficulty=easy&sort=price&sort=duration
  // duration: { gt: '5' },  difficulty: 'easy',  sort: [ 'price', 'duration' ]

  try {
    // BUILD QUERY
    const features = new APIFeatures(Tour, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // EXECUTE QUERY
    const tours = await features.execute();
    const selected = req.query.fields
      ? req.query.fields.split(',').filter(field => field === 'startDates' || Tour.fieldMap[field])
      : [];
    if (selected.length === 0 || selected.includes('startDates')) {
      await addStartDates(tours);
    }
    tours.forEach(tour => {
      delete tour.start_dates;
      if (selected.length > 0 && !selected.includes('id')) delete tour.id;
    });


    if (req.query.page && tours.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'This page does not exist'
      });
    }

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.getStats();

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = Number(req.params.year);

    if (!Number.isInteger(year) || year < 1 || year > 9999) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid year between 1 and 9999'
      });
    }

    const plan = await Departure.getMonthlyPlan(year);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.getById(req.params.id * 1);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID'
      });
    }

    await addStartDates([tour]);

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.createTour = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const { startDates = [], ...tourData } = req.body;
    const newTour = await Tour.create(tourData, client);
    await Departure.replaceByTourId(newTour.id, startDates, client);
    await addStartDates([newTour], client);

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');

    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  } finally {
    if (client) client.release();
  }
};

exports.updateTour = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const { startDates, ...tourData } = req.body;
    const tour = await Tour.update(req.params.id * 1, tourData, client);

    if (!tour) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID'
      });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'startDates')) {
      await Departure.replaceByTourId(tour.id, startDates, client);
    }

    await addStartDates([tour], client);
    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');

    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  } finally {
    if (client) client.release();
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.delete(req.params.id * 1);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};
