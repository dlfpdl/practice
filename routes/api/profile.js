const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const verify = require('../../middleware/verify')
const ProfileSchema = require('../../models/ProfileSchema');
const UserSchema = require('../../models/UserSchema');
const { check, validationResult } = require('express-validator');



// @route  GET api/profile/myprofile
// @desc   GET current user's profile
// @access Private

router.get('/myprofile', verify, async (req, res) => {
    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'No Profile' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Profile Auth Error')
    }
});

// @route  GET api/profile
// @desc   Create OR Update user profile
// @access Private
router.post(
    '/', 
    [verify, [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skill is required').not().isEmpty()
    ]],
    // (res, res) 함수 이후에는 => 화살표, 그리고 오브젝트를 열어준다.
    async (req, res) => {
        const errors = validationResult(req);
        // if () {} 방식으로, if 함수 뒤에는 중괄호를 열어 에러를 return 한다. 
        if(!errors.isEmpty()) {
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
            linkedin
        } = req.body;

        // Build Profile Object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // 오브젝트 안에 오브젝트를 call 하려면 outerobject.innerobject 하면 된다. 
        // i.e. console.log(profileFields.skills);
        // Build Social Object, to define it as profile object, we need to define innerobject as well
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;

        try {
            let profile = await ProfileSchema.findOne({ user: req.user.id });

            if(profile) {
                // Update
                profile = await ProfileSchema.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields}, 
                    { new: true }
                );

                return res.json(profile);
            }
            
            // Create
            profile = new ProfileSchema(profileFields);
            await profile.save();
            res.json(profile);
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Profile Build/Update Server Error');
        }
    }
);

// @route  GET api/profile
// @desc   GET all profiles from URL/api/profile
// @access Public
router.get('/', async (req, res) => {
    try {
        const profiles = await ProfileSchema.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Profile Server Error');
    }
});

// @route  GET api/profile/user/:user_id
// @desc   GET Profile by user_id
// @access Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await ProfileSchema.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if(!profile) return res.status(400).json({ msg: 'There is no profile for this user'});

        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Profile Server Error');
    }
});

// @route  GET api/profile/user/:user_id
// @desc   Delete profile, user, and post
// @access Private
router.delete('/', verify, async (req, res) => {
    try {
        // remove post
        // Remove Profile
        await ProfileSchema.findOneAndRemove({ user: req.user.id });
        await UserSchema.findByIdAndRemove({ _id: req.user.id });

        res.json({msg: 'user removed'});
    } catch(err) {
        console.error(err.message);
        res.status(500).send(' User / Post Delete Error');
    }
});

// @route  GET api/profile/user/experience
// @desc   Add Experience in profile
// @access Private
router.put('/experience', [verify, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }
    
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id });

        // Add it to Object
        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Experience Create Error');
    }
});

// @route  GET api/profile/experience
// @desc   Delete Experience from profile
// @access Private
router.delete('/experience/:exp_id', verify, async (req, res) => {
    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id });

        // Ger remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(err.message);
        res.status(500).send('Experience Delete Error');
    }
});

// @route  GET api/profile/education
// @desc   Add education in profile
// @access Private
router.put('/education', [verify, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('field', 'Field of Study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }
    
    const {
        school,
        degree,
        field,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        field,
        from,
        to,
        current,
        description
    };

    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id });

        // Add it to Object
        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Education Create Error');
    }
});

// @route  GET api/profile/user/education
// @desc   Delete Education from profile
// @access Private
router.delete('/education/:edu_id', verify, async (req, res) => {
    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id });

        // Ger remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(err.message);
        res.status(500).send('Education Delete Error');
    }
});

// @route  GET api/profile/github/:username
// @desc   GET user repos from github
// @access Public

router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            // Config 같은 글로벌 variables 들을 가져오기 위해서는 const 이름 = require('관련 것들이 적혀있는 json 파일') 이후, 이름.get('') 하면 된다. 
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent' : 'node.js' }
        };
        
        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !==200) {
                res.status(404).json({ msg : "no github profile found"});
            }

            res.json(JSON.parse(body));
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Github get user error');
    }
});
module.exports = router;