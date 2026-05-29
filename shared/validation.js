// input checks for each endpoint, kept in one place
'use strict';

const { CATEGORIES } = require('./models/costs');

// every validator returns { ok: true } or { ok: false, id, message }

const validateAddUser = (body) => {
  const { id, first_name, last_name, birthday } = body;

  // id has to be there and be an actual number
  if (id === undefined || id === null) {
    return { ok: false, id: 'validation_error', message: 'id is required' };
  }
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    return { ok: false, id: 'validation_error', message: 'id must be a number' };
  }
  // both names are required and can't be blank
  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return { ok: false, id: 'validation_error', message: 'first_name is required' };
  }
  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    return { ok: false, id: 'validation_error', message: 'last_name is required' };
  }
  // birthday is required and has to be a parseable date
  if (!birthday) {
    return { ok: false, id: 'validation_error', message: 'birthday is required' };
  }
  const parsedBirthday = new Date(birthday);
  if (isNaN(parsedBirthday.getTime())) {
    return { ok: false, id: 'validation_error', message: 'birthday must be a valid date' };
  }
  // a birthday can't be in the future
  if (parsedBirthday.getTime() > Date.now()) {
    return { ok: false, id: 'validation_error', message: 'birthday cannot be in the future' };
  }
  return { ok: true };
};

const validateAddCost = (body) => {
  const { description, category, userid, sum, date } = body;

  // need a non-empty description
  if (!description || typeof description !== 'string' || !description.trim()) {
    return { ok: false, id: 'validation_error', message: 'description is required' };
  }
  // category has to be one of the ones we support
  if (!category || !CATEGORIES.includes(category)) {
    return {
      ok: false,
      id: 'validation_error',
      message: `category must be one of: ${CATEGORIES.join(', ')}`,
    };
  }
  // userid is required and numeric (we check it actually exists later, in the route)
  if (userid === undefined || userid === null) {
    return { ok: false, id: 'validation_error', message: 'userid is required' };
  }
  if (typeof userid !== 'number' || !Number.isFinite(userid)) {
    return { ok: false, id: 'validation_error', message: 'userid must be a number' };
  }
  // sum is required and you can't spend zero or a negative amount
  if (sum === undefined || sum === null) {
    return { ok: false, id: 'validation_error', message: 'sum is required' };
  }
  if (typeof sum !== 'number' || !Number.isFinite(sum) || sum <= 0) {
    return { ok: false, id: 'validation_error', message: 'sum must be a positive number' };
  }
  // a date is optional, but we refuse anything in the past so finished
  // months can be cached safely
  if (date !== undefined) {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return { ok: false, id: 'validation_error', message: 'date must be a valid date' };
    }
    // already-passed dates aren't allowed
    if (parsed.getTime() < Date.now()) {
      return { ok: false, id: 'past_date_not_allowed', message: 'date cannot be in the past' };
    }
  }
  return { ok: true };
};

const validateReportQuery = (query) => {
  const { id, year, month } = query;

  // query string values arrive as strings
  const userId = Number(id);
  const yr     = Number(year);
  const mo     = Number(month);

  // all three are required; month also has to be a real calendar month
  if (!id || !Number.isFinite(userId)) {
    return { ok: false, id: 'validation_error', message: 'id must be a number' };
  }
  if (!year || !Number.isFinite(yr)) {
    return { ok: false, id: 'validation_error', message: 'year must be a number' };
  }
  if (!month || !Number.isFinite(mo) || mo < 1 || mo > 12) {
    return { ok: false, id: 'validation_error', message: 'month must be a number between 1 and 12' };
  }
  return { ok: true, userId, year: yr, month: mo };
};

const validateUserId = (param) => {
  // the id comes off the url as a string, so coerce and check it
  const id = Number(param);
  if (!Number.isFinite(id)) {
    return { ok: false, id: 'validation_error', message: 'id must be a number' };
  }
  return { ok: true, id };
};

module.exports = {
  validateAddUser,
  validateAddCost,
  validateReportQuery,
  validateUserId,
};
