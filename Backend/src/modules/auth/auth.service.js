/**
 * Auth service — business logic for login.
 *
 * Responsibilities:
 *   1. Verify the MSG91 OTP access-token server-side (closes the bypass where
 *      the old code trusted any mobile number).
 *   2. Look up the user and mint the application JWT.
 *
 * The controller stays thin; all DB / external calls live here so they can be
 * unit-tested in isolation.
 */
const axios = require("axios");
const jwt = require("jsonwebtoken");

const config = require("../../config");
// Bridge to the existing models during the incremental migration.
const db = require("../../../app/models");

const User = db.user;
const BuilderUser = db.builderUser;
const UserCategory = db.userCategory;
const Category = db.category;

class ConfigError extends Error {}
class AuthError extends Error {}

/**
 * Verify the MSG91 widget access-token against MSG91's API.
 * Fails closed: if no auth key is configured, verification cannot pass.
 * @param {string} accessToken token returned by the MSG91 widget after OTP
 * @returns {Promise<boolean>}
 */
async function verifyMsg91AccessToken(accessToken) {
  if (!accessToken) return false;

  if (!config.msg91.authKey) {
    throw new ConfigError(
      "MSG91_AUTH_KEY is not configured; cannot verify OTP server-side."
    );
  }

  const response = await axios.post(config.msg91.verifyUrl, {
    authkey: config.msg91.authKey,
    "access-token": accessToken,
  });

  return Boolean(response && response.data && response.data.type === "success");
}

/**
 * Build the JWT payload + user response for a given mobile number.
 * @returns {Promise<{token:string,user:object}|null>} null if no such user
 */
async function loginByMobile(mobileNumber) {
  const user = await User.findOne({
    where: { mobileNumber },
    raw: true,
    nest: true,
  });

  if (!user) return null;

  const jwtPayload = {
    Email: user.email,
    name: user.username,
    mobileNumber: user.mobileNumber,
    Role: user.role_id,
    id: user.user_id,
  };

  if (user.role_id === 2) {
    const builder = await BuilderUser.findOne({
      where: { user_id: user.user_id },
      raw: true,
      attributes: ["builder_id"],
    });
    if (builder) jwtPayload.builder_id = builder.builder_id;
  }

  const categories = await UserCategory.findAll({
    where: { user_id: user.user_id },
    attributes: ["user_id"],
    include: [{ model: Category, attributes: ["category_id", "category_name"] }],
    raw: true,
  });

  const categoryIds = Array.from(
    new Set([
      ...(categories
        ? categories.map((item) => item["category.category_id"])
        : []),
      user.role_id,
    ])
  );
  jwtPayload.categoryIds = categoryIds;

  const token = jwt.sign(jwtPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  // Persist the latest token (fixes the legacy bug: wrong column `roken`
  // and wrong primary key `id` -> the update silently no-op'd).
  await User.update({ token }, { where: { user_id: user.user_id } });

  const userData = {
    email: user.email,
    name: user.username,
    mobileNumber: user.mobileNumber,
    role_id: user.role_id,
    user_id: user.user_id,
    category: categories,
    categoryIds,
  };
  if (jwtPayload.builder_id) userData.builder_id = jwtPayload.builder_id;

  return { token, user: userData };
}

/**
 * Whether a user exists for the given mobile number (used by the pre-check
 * endpoint the frontend calls before sending an OTP).
 */
async function userExists(mobileNumber) {
  const user = await User.findOne({
    where: { mobileNumber },
    raw: true,
    attributes: ["user_id"],
  });
  return Boolean(user);
}

module.exports = {
  verifyMsg91AccessToken,
  loginByMobile,
  userExists,
  ConfigError,
  AuthError,
};
