/**
 * consumer service — data-access helpers for the consumer domain.
 * (Used by the large addConsumer flow for its foreign-key and duplicate checks.)
 */
const db = require("../../../app/models");

/** True only if the role, unit and category all exist. */
async function checkForeignKeys(role_id, unit_id, category_id) {
  const [roleExists, unitExists, categoryExists] = await Promise.all([
    db.role.findByPk(role_id),
    db.unit.findByPk(unit_id),
    db.unit_category_list.findByPk(category_id),
  ]);
  return Boolean(roleExists && unitExists && categoryExists);
}

/** Find a builder-consumer matching the unique placement combination. */
function findDuplicate({ unit_id, office_no, category_id, floor_id, wing_id }) {
  return db.builderConsumer.findOne({
    where: { unit_id, office_no, category_id, floor_id, wing_id },
  });
}

/**
 * Create a builder-consumer.
 * For status "interested" it also finds-or-creates the consumer User and links
 * the builder. Otherwise it creates a standalone builder-consumer row.
 * @returns {{userCreateFailed:true}
 *          |{builderConsumerData:object,user?:object,isInterested:boolean}}
 */
async function createBuilderConsumer(payload, actorId) {
  const {
    username, email, mobileNumber, role_id, unit_id, status, remarks,
    builder_id, office_no, category_id, sqFeet, srNo, floor_id, wing_id,
    builder_user_id, referenceName,
  } = payload;

  if (status !== "interested") {
    const builderConsumerData = await db.builderConsumer.create({
      unit_id, status, sqFeet, srNo, floor_id, wing_id, builder_id,
      office_no, category_id, referenceName,
    });
    return { builderConsumerData, isInterested: false };
  }

  // "interested" -> ensure the consumer user exists.
  let user = await db.user.findOne({ where: { mobileNumber } });
  if (user) {
    if (builder_user_id && user.builder_user !== builder_user_id) {
      await db.user.update(
        { builder_user: builder_user_id, is_from_builder_user: 1, updated_by: actorId },
        { where: { user_id: user.user_id } }
      );
    }
  } else {
    user = await db.user.create({
      username, email, mobileNumber, role_id: 5, otp: "", token: "",
      created_by: actorId, updated_by: actorId,
      builder_user: builder_user_id, is_from_builder_user: 1, referenceName,
    });
    if (!user || !user.user_id) return { userCreateFailed: true };
  }

  const builderConsumerData = await db.builderConsumer.create({
    role_id, unit_id, status, sqFeet, srNo, floor_id, wing_id, remarks,
    builder_id, office_no, category_id, user_id: user.user_id, referenceName,
  });

  return { builderConsumerData, user, isInterested: true };
}

module.exports = { checkForeignKeys, findDuplicate, createBuilderConsumer };
