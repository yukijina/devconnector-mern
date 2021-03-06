const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @route GET api/auth
// @desc  assign current user
// @access Public
router.get('/', auth, async (req, res) => {
  console.log(req);
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.log(err.mesage);
    res.status(500).send('Server Error');
  }
});

// @route POSDT api/auth
// @desc  Authentication user and get token - Login
// @access Public
router.post(
  '/',
  [
    // check and function is from express-validate
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // See if user exists
      const user = await User.findOne({ email });

      if (!user) {
        res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id, // mongoose use .id (not ._id)
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
  }
);

module.exports = router;
