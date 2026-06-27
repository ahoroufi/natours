const Tour = require('../models/tourModel');

exports.getAllTours = async (req, res) => {
// api/v1/tours?duration[gtn]=5&difficulty=easy
  try {
    // BUILD QUERY
    // 1A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    //{ difficulty: 'easy', duration: {gte: '5'} }
    //{ difficulty: 'easy', duration: {'$gte': '5'} }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);

    // 1B) Sorting
    const sort = req.query.sort;

    const tours = await Tour.find(parsedQuery, sort);
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

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.getById(req.params.id * 1);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID'
      });
    }

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
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.update(req.params.id * 1, req.body);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
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