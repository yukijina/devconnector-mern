const express = require('express');

const request = require('request');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { route } = require('./users');

// @route GET api/profile/me
// @desc  Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id, // user is accessible - check schema
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(400).send('Server Error');
  }
});

// @route POST api/profile
// @desc  Create or Update users profile
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skils is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      // make it to array
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.status(200).json({
          status: 'updated',
          profile,
        });
      }

      // Create
      profile = new Profile(profileFields);

      await profile.save();
      res.status(200).json({
        status: 'success',
        profile,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }

    console.log(profileFields.social);
    res.send('Hello');
  }
);

// @route GET api/profile
// @desc  Get all profile
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.status(200).json({
      status: 'success',
      count: profiles.length,
      profiles,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/profile/user/user_id
// @desc  Get a profile by user ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile)
      return res.status(400).json({ msg: 'There is no profile for this user' });

    res.status(200).json({
      status: 'success',
      profile,
    });
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId') {
      res.status(400).send('Profile not found');
    }
    res.status(500).send('Server Error');
  }
});

// @route DELETE api/profile
// @desc  Delete profile
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo = remove users post

    //Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //Remove User
    await User.findOneAndRemove({ _id: req.user.id });

    res.status(200).json({
      status: 'success',
      msg: 'User deleted',
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/profile/experience
// @desc  Add profile experience
// @access Private
///** create(put) embedded array */
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = { title, company, location, from, to, current, description };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);

      await profile.save();

      res.status(200).json({
        status: 'success',
        profile,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route DELETE api/profile/experience/:exp_id
// @desc  Delete experience from profile
// @access Private
// ** remove embedded experience
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json({
      status: 'successfully deleted',
      profile,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT api/profile/education
// @desc  Add profile education
// @access Private
///** create(put) embedded array */
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newExp);

      await profile.save();

      res.status(200).json({
        status: 'success',
        profile,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route DELETE api/profile/education/:exp_id
// @desc  Delete education from profile
// @access Private
// ** remove embedded education
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json({
      status: 'successfully deleted',
      profile,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/profile/github/:username
// @desc  Get user repos from Github
// @access Public
//*** NEED A GITHUB OPERSONAL TOKEN */
// router.get('/github/:username', (req, res) => {
//   try {
//     const options = {
//       uri: encodeURI(`https://api/ithub.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`),
//       method: 'GET',
//       headers: { 'user-agent': 'node.js', Authorization: `token ${}` },
//     };

//     request(options, (error, response, body) => {
//       if (error) console.log(error);

//       if (response.statusCode != 200) {
//         res.status(404).json({ msg: 'No Github Profile profie found ' });
//       }

//       res.json(JSON.parse(body));
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send('Server error');
//   }
// });

module.exports = router;
