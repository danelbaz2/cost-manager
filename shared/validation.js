/* validation.js — per-endpoint input validators (Q1: validate all data) */
'use strict';

const { CATEGORIES } = require('./models/costs');

/* Each validator returns { ok: true } on success, or
   { ok: false, id, message } describing the problem. */

// Validate body for POST /api/add (user)
const validateAddUser = (body) => {
  const { id, first_name, last_name, birthday } = body;

  // id is required and must be a finite number
  if (id === undefined || id === null) {
    return { ok: false, id: 'validation_error', message: 'id is required' };
  }
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    return { ok: false, id: 'validation_error', message: 'id must be a number' };
  }
  // first_name and last_name must be non-empty strings
  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return { ok: false, id: 'validation_error', message: 'first_name is required' };
  }
  if (!last_name || typeof last_name !== 'string' || !last_name.trim()) {
    return { ok: false, id: 'validation_error', message: 'last_name is required' };
  }
  // birthday is required, must be YYYY-MM-DD format, a valid date, and in the past
  if (!birthday) {
    return { ok: false, id: 'validation_error', message: 'birthday is required' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return { ok: false, id: 'validation_error', message: 'birthday must be in YYYY-MM-DD format' };
  }
  const birthdayDate = new Date(birthday);
  if (isNaN(birthdayDate.getTime())) {
    return { ok: false, id: 'validation_error', message: 'birthday must be a valid date' };
  }
  if (birthdayDate.getTime() >= Date.now()) {
    return { ok: false, id: 'validation_error', message: 'birthday must be in the past' };
  }
  return { ok: true };
};

// Validate body for POST /api/add (cost)
const validateAddCost = (body) => {
  const { description, category, userid, sum, date } = body;

  // description must be a non-empty string
  if (!description || typeof description !== 'string' || !description.trim()) {
    return { ok: false, id: 'validation_error', message: 'description is required' };
  }
  // category must be one of the five supported values
  if (!category || !CATEGORIES.includes(category)) {
    return {
      ok: false,
      id: 'validation_error',
      message: `category must be one of: ${CATEGORIES.join(', ')}`,
    };
  }
  // userid is required and must be a finite number
  if (userid === undefined || userid === null) {
    return { ok: false, id: 'validation_error', message: 'userid is required' };
  }
  if (typeof userid !== 'number' || !Number.isFinite(userid)) {
    return { ok: false, id: 'validation_error', message: 'userid must be a number' };
  }
  // sum is required and must be a positive finite number
  if (sum === undefined || sum === null) {
    return { ok: false, id: 'validation_error', message: 'sum is required' };
  }
  if (typeof sum !== 'number' || !Number.isFinite(sum) || sum <= 0) {
    return { ok: false, id: 'validation_error', message: 'sum must be a positive number' };
  }
  // date is optional; when provided it must be valid and not in the past
  if (date !== undefined) {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return { ok: false, id: 'validation_error', message: 'date must be a valid date' };
    }
    // Strict past-date rejection: any date earlier than now is refused
    if (parsed.getTime() < Date.now()) {
      return { ok: false, id: 'past_date_not_allowed', message: 'date cannot be in the past' };
    }
  }
  return { ok: true };
};

// Validate query params for GET /api/report
const validateReportQuery = (query) => {
  const { id, year, month } = query;

  // Convert string query params to numbers for comparison
  const userId = Number(id);
  const yr     = Number(year);
  const mo     = Number(month);

  // Each param is required and must be a finite number
  if (!id || !Number.isFinite(userId)) {
    return { ok: false, id: 'validation_error', message: 'id must be a number' };
  }
  if (!year || !Number.isFinite(yr)) {
    return { ok: false, id: 'validation_error', message: 'year must be a number' };
  }
  // month must be in the range 1..12
  if (!month || !Number.isFinite(mo) || mo < 1 || mo > 12) {
    return { ok: false, id: 'validation_error', message: 'month must be a number between 1 and 12' };
  }
  return { ok: true, userId, year: yr, month: mo };
};

// Validate :id URL param for GET /api/users/:id
const validateUserId = (param) => {
  const id = Number(param);
  // The URL param arrives as a string; Number() converts it
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
