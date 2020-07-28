const express = require('express');

const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { route } = require('./users');

// @route POST api/posts
// @desc  Create a post
// @access Private
// *** User is embedded in post
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.status(200).json({
        status: 'success',
        post,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route GET api/posts
// @desc  Get all posts
// @access Private
// *** User is embedded in post
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.status(200).json({
      status: 'success',
      count: posts.length,
      posts,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET api/posts
// @desc  Get a posts
// @access Private
// *** User is embedded in post
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.status(200).json({
      status: 'success',
      post,
    });
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ppost not found' });
    }

    res.status(500).send('Server Error');
  }
});

// @route DELETE api/posts
// @desc  delete a posts
// @access Private
// *** User is embedded in post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await post.remove();

    res.status(200).json({
      msg: 'Post successfully deleted',
    });
  } catch (err) {
    console.log(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Ppost not found' });
    }

    res.status(500).send('Server Error');
  }
});

// @route DELETE api/posts/like/:id
// @desc  Like a posts
// @access Private
// *** User is embedded in post
router.put('/like/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    // Check if the post has already been liked
    // video shows .length > 0 after req.user )

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.status(200).json(post.likes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route DELETE api/posts/unlike/:id
// @desc  Like a posts
// @access Private
// *** User is embedded in post
router.put('/unlike/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    // Check if the post has already been liked
    // video shows .length > 0 after req.user )

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet beenliked' });
    }
    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();

    res.status(200).json(post.likes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;
