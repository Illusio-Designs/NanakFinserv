const userController = require("../controllers/user.controller");
const verifyToken = require('../middleware/JWTAuth')

module.exports = (app) => {
  app.post("/user/login", userController.verifyUser);
  app.post("/user/resetPassword", userController.resetPasswordRequest);
  app.post("/user/updatePassword", userController.updatePasswordByMail);

  // normal user
  app.post("/user/data/add", userController.addData);
  app.put("/user/data/update", [verifyToken], userController.updateData);

  // builder user
  app.post("/user/data/add/builder", userController.addBuilderData);
  app.put("/user/data/update", [verifyToken], userController.updateData);
};
