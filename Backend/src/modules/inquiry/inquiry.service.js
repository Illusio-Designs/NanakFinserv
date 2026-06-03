/**
 * inquiry service — data-access for the inquiry domain.
 */
const db = require("../../../app/models");

const Inqueryuser = db.inqueryuser;

function create({ username, email, phone_number, service }) {
  return Inqueryuser.create({
    user_name: username,
    email,
    mobile_no: phone_number,
    services: service,
  });
}

function getAll() {
  return Inqueryuser.findAll({ raw: true });
}

module.exports = { create, getAll };
