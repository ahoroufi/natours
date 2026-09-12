class APIFeatures {
  constructor(model, queryString) {
    this.model = model;
    this.queryString = queryString;
    this.queryObj = {};
    this.limit = 100;
    this.skip = 0;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.queryObj = JSON.parse(queryStr);

    return this;
  }

  sort() {
    this.sortBy = this.queryString.sort;
    return this;
  }

  limitFields() {
    this.fields = this.queryString.fields;
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    this.limit = this.queryString.limit * 1 || 100;
    this.skip = (page - 1) * this.limit;
    return this;
  }

  // Our PostgreSQL model executes find() immediately, so run it after building
  // all the options instead of chaining methods on a Mongoose query.
  execute() {
    return this.model.find(
      this.queryObj,
      this.sortBy,
      this.fields,
      this.limit,
      this.skip
    );
  }
}

module.exports = APIFeatures;
