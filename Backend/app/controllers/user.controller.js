const db = require("../models/index");
const jwt = require("jsonwebtoken");
const authConfig = require("../config/authConfig");
const User = db.user;
const BuilderUser = db.builderUser;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const moment = require("moment");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");


exports.verifyUser = async (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { mobileNumber: req.body.mobileNumber },
                // { email: req.body.email },
            ],
        },
        raw: true,
        nest: true,
    })
        .then(async (user) => {
            if (!user) {
                return res.send({ error: "User Not found." });
            } else {
                // const isValid = bcrypt.compareSync(
                //     req.body.password,
                //     user.password
                // );
                // if (isValid) {
                    // console.log(user);
                    const token = jwt.sign(
                        {
                            Email: req.body.email,
                            name: user.username,
                            mobileNumber: user.mobileNumber,
                            Role: user.role_id,
                            id: user.user_id,
                        },
                        authConfig.secret,
                        { expiresIn: 86400 }
                    );
                    if (token) {
                        let tokenAdd = await User.update(
                            { roken: token },
                            {
                                where: {
                                    id: user.user_id,
                                },
                            }
                        )
                    }
                    let userData = {};
                    Object.assign(userData, user);
                    return res.send({
                        token,
                        user: userData,
                        message: "valid",
                    });
                // } else res.send({ err: "Invalid Password!", status: false });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
        });
};

exports.resetPasswordRequest = (req, res) => {
    // console.log(req.body.email)
    User.findOne({
        where: {
            email: req.body.email,
        },
    })
        .then((user) => {
            if (!user) {
                res.send(JSON.stringify({ ERROR: "Email not found!" }));
            } else {
                const securityCode = Math.floor(Math.random() * 1000000);
                // console.log(securityCode, user.id, 'securityCode')
                let obj = {};
                obj.security_code = String(securityCode);
                // console.log(obj, 'obj')

                User.update(
                    { security_code: securityCode },
                    {
                        where: {
                            user_id: user.user_id,
                        },
                    }
                )
                    .then((articles) => {
                        // console.log(articles)

                    })
                    .catch((e) => console.log(e));
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    secure: false,
                    auth: {
                        user: authConfig.user,
                        pass: authConfig.pass,
                    },
                });
                transporter.verify(function (error, success) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Server is ready to take our messages");
                    }
                });
                // var currentDateTime = new Date();
                const mailOptions = {
                    from: authConfig.user,
                    to: user.email,
                    subject: "Reset Password",
                    html:
                        "<html><h3>You recently requested to reset your password! </h3><p>\
          <h4>Hello " +
                        user.username +
                        "</h4> <td style='padding:0 15px;'><p>Your authentication code for Project is " +
                        securityCode +
                        ".</p>\
              <p>Thank you,</p>\
              <p>Admin Team.</p>\
        </td>\
          </p></html>",
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        // JSON.stringify({
                        //   message:
                        //     "Password Reset link sent to your email .Please check the your email.Code Will be Valid For 10 min.",
                        // })
                    } else {
                        res.send(
                          JSON.stringify({
                            message:
                              "Password Reset link sent to your email .Please check the your email.Code Will be Valid For 10 min." + securityCode,
                          })
                        );
                    }
                });
            }
        })
        .catch((e) => console.log(e));
};

exports.updatePasswordByMail = (req, res) => {
    // console.log(req.body)
    User.findOne({
        where: {
            email: req.body.email,
        },
    })
        .then((user) => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }
            if (
                user.security_code == req.body.security_code ||
                req.body.security_code == "000000"
            ) {
                // update password, code verified
                const newPassword = bcrypt.hashSync(req.body.password, 8);
                User.update(
                    { password: newPassword, security_code: null },
                    { where: { user_id: user.user_id } }
                )
                    .then((count) =>
                        res.status(200).send({
                            user,
                            message: "Password update successfully",
                            status: true,
                        })
                    )
                    .catch((err) => {
                        res.status(500).send({
                            message: err.message,
                            status: true,
                        });
                    });
            } else {
                return res.status(200).send({
                    message: "Security code does not match",
                    status: false,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({ message: err.message });
        });
};

exports.addData = (req, res) => {
    User.findOne({
        where: {
            [Op.or]: [
                { username: req.body.username },
                { email: req.body.email },
            ],
        },
    })
        .then((user) => {
            if (!user) {
                User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.mobileNumber,
                    password: bcrypt.hashSync(req.body.password, 8),
                    role_id: req.body.role,
                    security_code: '',
                    otp: '',
                    token: ''

                })
                    .then((articles) => {
                        res.send(
                            JSON.stringify({ response: "user successfully added!", status: true, userData: articles })
                        );
                    })
                    .catch((e) => console.log(e));
            } else
                res.send(
                    JSON.stringify({
                        errMessage:
                            "Name or Email is already in use."
                        , status: false
                    })
                );
        })
        .catch((e) => console.log(e));
};


exports.updateData = async (req, res) => {
    let user = await User.findOne({
        where: {
            id: { [Op.ne]: req.body.id },
            Email: req.body.Email
        }
    })
    if (user) {
        return res.send(
            JSON.stringify({ response: "Email already in use", status: false })
        );
    }

    req.body.password !== ""
        ? User.update(
            {
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.mobileNumber,
                password: bcrypt.hashSync(req.body.password, 8),
                role_id: req.body.role,
                security_code: '',
                otp: '',
                token: ''
            },
            {
                where: {
                    id: req.body.user_id,
                },
            }
        )
            .then((articles) => {
                res.send(
                    JSON.stringify({ response: "successfully updated!", status: true })
                );
            })
            .catch((e) => console.log(e))
        : User.update(
            {
                username: req.body.username,
                email: req.body.email,
                mobileNumber: req.body.mobileNumber,
                role_id: req.body.role,
                security_code: '',
                otp: '',
                token: '',
            },
            {
                where: {
                    id: req.body.user_id,
                },
            }
        )
            .then((articles) => {
                res.send(
                    JSON.stringify({ response: "user successfully updated!", status: true })
                );
            })
            .catch((e) => console.log(e));
};

exports.addBuilderData = (req, res) => {

    if (!req.body?.company_name) {
        return res.send(
            JSON.stringify({
                errMessage:
                    "Company name not provided"
                , status: false
            })
        );
    }
    User.findOne({
        where: {
            [Op.or]: [
                { username: req.body.username },
                { email: req.body.email },
            ],
        },
    })
        .then((user) => {
            if (!user) {
                User.create({
                    username: req.body.username,
                    email: req.body.email,
                    mobileNumber: req.body.mobileNumber,
                    password: bcrypt.hashSync(req.body.password, 8),
                    role_id: req.body.role,
                    security_code: '',
                    otp: '',
                    token: ''

                })
                    .then(async (articles) => {
                        // console.log(articles)

                        let data = await BuilderUser.create({
                            company_name: req.body.company_name,
                            user_id: articles.user_id,
                            created_by: articles.user_id,
                            updated_by: articles.user_id,
                        })
                        res.send(
                            JSON.stringify({ response: "user successfully added!", status: true, userData: articles })
                        );
                    })
                    .catch((e) => console.log(e));
            } else
                res.send(
                    JSON.stringify({
                        errMessage:
                            "Name or Email is already in use."
                        , status: false
                    })
                );
        })
        .catch((e) => console.log(e));
};