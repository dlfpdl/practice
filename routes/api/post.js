const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const verify = require('../../middleware/verify');

const PostSchema = require('../../models/PostSchema');
const ProfileSchema = require('../../models/ProfileSchema');
const UserSchema = require('../../models/UserSchema');
 
// @route  GET api/user
// @desc   Create a post
// @access Private

router.post('/', [verify, [
    check('text', 'text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await UserSchema.findById(req.user.id).select('-password');

        const newPost = new PostSchema({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();

        res.json(post);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Post Create Error');
    }
});

// @route  GET api/post
// @desc   GET posts
// @access Private (for later, we will need to accumulate user, but if certain people wanna look up data)
// they'll need to register to our platform LOL
// 이 부분이 현재 데이스티 포스트 정렬에 있어서 중요한 부분일 수 있다. 이곳에 sorting algorithm을 트렌드를 적용시키면, 버튼별로 트렌드/최신을
// 나눌 수 있을 것이다. 따라서 Post Route 부분을 잘 살펴볼 것. 

router.get('/', verify, async(req, res) =>{
    try {
        const posts = await PostSchema.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('GET Post Error');
    }
});

// @route GET api/posts/:id
// @desc GET post by ID
// @access Private
router.get('/:id', verify, async(req, res) => {
    try {
        // Get post by ID (Post Identification ID)
        const post = await PostSchema.findById(req.params.id);
        
        if(!post) {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        res.json(post);
    } catch (error) {
        console.error(error.message);
        if(error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        res.status(500).send('GET Post by ID Error');
    } 
});

// @route Delete api/posts/:id
// @desc Delete a post
// @access Private
router.delete('/:id', verify, async(req, res) =>{
    try {
        const post = await PostSchema.findById(req.params.id);

        // Check user

        if(!post) {
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        
        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'});
        }

        await post.remove();

        res.json({ msg: 'Post Removed'});
    } catch (error) {
        console.error(error.message);
        if(error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found' });
        } 
        res.status(500).send('Delete Post Error');
    }
});

// @route PUT api/post/like/:id
// @desc Like a post
// @access Private

router.put('/like/:id', verify, async (req, res) =>{
    try {
        const post = await PostSchema.findById(req.params.id);

        // Check if the post has already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post Already Liked'});
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Post Like Error');
    }
});

// @route PUT api/post/unlike/:id
// @desc Unlike a post
// @access Private 

router.put('/unlike/:id', verify, async (req, res) =>{
    try {
        const post = await PostSchema.findById(req.params.id);

        // Check if the post has already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Post Unlike Error');
    }
});

// @route  GET api/post/comment/:id
// @desc   Comment on a post
// @access Private
router.post('/comment/:id', [verify, [
    check('text', 'text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await UserSchema.findById(req.user.id).select('-password');
        const post = await PostSchema.findById(req.params.id);

        const newComment = new PostSchema({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Post Create Error');
    }
});

// @route  DELETE api/post/comment/:id/:comment_id
// @desc   Delete comment on a post
// @access Private
router.delete('/comment/:id/:comment_id', verify, async (req, res) => {
    try {
        const post = await PostSchema.findById(req.params.id);

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Check if there's comment
        if(!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // Check User
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id); 
        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Delete Comment Error');
    }
});
module.exports = router;