/**
 * mediclaim service — data-access for the mediclaim domain.
 * (Incremental extraction: company operations live here now; the large
 * product/user flows still live in the controller.)
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

const MediclaimCompany = db.mediclaimCompany;

function getCompanies() {
  return MediclaimCompany.findAll({ raw: true });
}

/** @returns {{conflict:true}|{created:object}} */
async function addCompany(name) {
  const existing = await MediclaimCompany.findOne({
    where: { mediclaim_company_name: name },
  });
  if (existing) return { conflict: true };
  const created = await MediclaimCompany.create({ mediclaim_company_name: name });
  return { created };
}

/** @returns {{conflict:true}|{result:any}} */
async function updateCompany(id, name) {
  const dupe = await MediclaimCompany.findOne({
    where: {
      mediclaim_company_id: { [Op.ne]: id },
      mediclaim_company_name: name,
    },
  });
  if (dupe) return { conflict: true };
  const result = await MediclaimCompany.update(
    { mediclaim_company_name: name },
    { where: { mediclaim_company_id: id } }
  );
  return { result };
}

module.exports = { getCompanies, addCompany, updateCompany };
